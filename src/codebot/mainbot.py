# -*- coding: utf-8 -*-

from preprocessing import *
from utilities import *
import sys
import traceback
import string

from random import choice

# Set terminal encoding to utf-8
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

class codebot:
    def __init__(self):
        self.__path = os.path.dirname(os.path.abspath(__file__))
        self.__load_KB()
        self.__load_models()

        self.raw_stack = []
        self.vec_stack = []
        
        # The following 2 attributes are mostly for debugging.
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
        self.kb = read_json(f'{self.__path}/model/knowledge.json')   # kb[term][context][intent]
        self.rb = read_json(f'{self.__path}/model/response.json')    # rb[intent]

    def __load_models(self):
        # Preprocessing Model:
        self.preprocessor = joblib.load(f'{self.__path}/model/preprocessing.bin')

        # Linear Support Vector Classifiers:
        self.intent_clf = joblib.load(f'{self.__path}/model/model_intent.bin')
        self.context_clf = joblib.load(f'{self.__path}/model/model_context.bin')
    
    def __read_input(self, input_str):
        self.raw_stack.append(input_str)
        self.vec_stack.append(self.preprocessor.transform(pd.Series(input_str)))
    
    def __get_intent(self):
        X = self.vec_stack[-1]
        self.intent = {
            'name': self.intent_clf.predict(X)[0],
            'conf': np.max(self.intent_clf.decision_function(X))
        }
        return self.intent
    
    def __get_context(self):
        X = self.vec_stack[-1]
        self.context = {
            'name': self.context_clf.predict(X)[0],
            'conf': np.max(self.context_clf.decision_function(X))
        }
        return self.context
    
    def __parse_rb(self, response):
        if '$' not in response:
            return response[0].upper() + response[1:]
        replaces = dict(
            (w, choice(self.rb[w])) 
            for w in response.translate(str.maketrans('', '', string.punctuation.replace('$',''))).split() 
            if w[0] == '$' and w in self.rb)
        # print(response.split())
        # print(replaces)
        for key in replaces:
            response = response.replace(key, replaces[key])
        return self.__parse_rb(response)

    def __get_response(self):
        # Intent:
        self.__get_intent()
        if self.intent['conf'] >= 0.0:
            if self.intent['name'] in ('agree', 'disagree') and not self.need_confirm:
                intent = 'other'
            else:
                intent = self.intent['name']
        else:
            intent = "low_conf"

        # Context:
        self.__get_context()
        if self.context['conf'] >= 0.0:
            context = self.context['name']
        else:
            context = "general"
        
        # Build answers:
        rb_intent = self.rb[intent]
        answer = ''
        if isinstance(rb_intent, list):
            answer = choice(rb_intent)
        else:
            answer = choice(rb_intent[context])

        if isinstance(answer, list):
            return [self.__parse_rb(sen) for sen in answer]
            # return answer
        return [self.__parse_rb(answer)]
        # return [answer]

    def answer(self, input_str):
        self.__read_input(input_str)
        return json.dumps(self.__get_response(), ensure_ascii=False)

if __name__ == "__main__":
    try:
        bot_instance = codebot()
        while True:
            print(bot_instance.answer(input()))
    except Exception as ex:
        print("An error has occured! Here is the error details:")
        try:
            print(bot_instance.intent, bot_instance.context)
            traceback.print_tb(ex.__traceback__, file=sys.stdout)
            print(ex)
        except Exception as another_ex:
            print("Another error has occured::", another_ex)
    finally:
        pass
