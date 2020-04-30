# -*- coding: utf-8 -*-

from preprocessing import *
from utilities import *
import sys
import traceback

from random import choice

# Set terminal encoding to utf-8
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

class codebot:
    def __init__(self):
        
        self.__load_KB()
        self.__load_models()

        # State Information:
        self.raw_stack = []
        self.vec_stack = []
        
        self.intent = None          # Intent of user
        self.context = None         # Context is for looking up the exact language in kb

        self.need_confirm = False
    
    def __repr__(self):
        return '<%s.%s object at %s>' % (
            self.__class__.__module__,
            self.__class__.__name__,
            hex(id(self))
        )
    
    def __load_KB(self):
        self.kb = read_json('./src/codebot/model/knowledge.json')   # kb[term][context][intent]
        self.rb = read_json('./src/codebot/model/response.json')    # rb[intent]

    def __load_models(self):
        # Preprocessing Model:
        self.preprocessor = joblib.load('./src/codebot/model/preprocessing.bin')

        # Linear Support Vector Classifiers:
        self.intent_clf = joblib.load('./src/codebot/model/model_intent.bin')
        self.context_clf = joblib.load('./src/codebot/model/model_context.bin')

    def answer(self, input_str):
        # input_sentences = list(filter(lambda s: len(s) , re.sub('[\.\?\!]', '\n', input_str).split('\n')))
        input_sentences = input_str
        
        # Push in queues:
        self.raw_stack.append(input_str)
        self.vec_stack.append(self.preprocessor.transform(pd.Series(input_sentences)))

        
        X = self.vec_stack[-1]
        # Intent:
        self.intent = {
            'name': self.intent_clf.predict(X)[0],
            'conf': np.max(self.intent_clf.decision_function(X))
        }
        if self.intent['conf'] >= 0.0:
            if self.intent['name'] in ('agree', 'disagree') and not self.need_confirm:
                intent = 'other'
            else:
                intent = self.intent['name']
        else:
            intent = "low_conf"

        # Context:
        self.context = {
            'name': self.context_clf.predict(X)[0],
            'conf': np.max(self.context_clf.decision_function(X))
        }
        if self.context['conf'] >= 0.0:
            context = self.context['name']
        else:
            context = "general"
        
        # Reply:
        # answers = [self.intent, self.context]
        answers = []
        rb_intent = self.rb[intent]
        if isinstance(rb_intent, list):
            answers.append(choice(rb_intent))
        else:
            answers.append(choice(rb_intent[context]))
        
        return json.dumps(answers, ensure_ascii=False)

if __name__ == "__main__":
    try:
        bot_instance = codebot()
        while True:
            print(bot_instance.answer(input()))
    except Exception as ex:
        print("An error has occured! Here is the error details:")
        try:
            traceback.print_tb(ex.__traceback__, file=sys.stdout)
            print(ex)
        except Exception as another_ex:
            print("Another error has occured::", another_ex)
    finally:
        pass
