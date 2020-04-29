# -*- coding: utf-8 -*-

from preprocessing import *
from utilities import *
import sys
import traceback

# Set terminal encoding to utf-8
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

class codebot:
    def __init__(self):
        
        # self.__load_KB()
        self.__load_models()

        # State Information:
        self.raw_queue = []
        self.vec_queue = []
        self.state = {
            'intent': None,         # Intent of user
            'context': 'general',   # Context is for looking up the right entity in kb
        }
    
    def __repr__(self):
        return '<%s.%s object at %s>' % (
            self.__class__.__module__,
            self.__class__.__name__,
            hex(id(self))
        )
    
    def __load_KB(self):
        self.kb = read_json('./KB/knowledge.json')             # kb[term][context][intent]
        self.rb = read_json('./KB/dir_path}/response.json')    # rb[relevance][intent]

    def __load_models(self):
        # Preprocessing Model:
        self.preprocessor = joblib.load('./model/preprocessing.bin')

        # Linear Support Vector Classifiers:
        self.intent_clf = joblib.load('./model/model_intent.bin')
        self.context_clf = joblib.load('./model/model_context.bin')

    def answer(self, input_str):
        input_sentences = list(filter(lambda s: len(s) , re.sub('[\.\?\!]', '\n', input_str).split('\n')))
        if len(input_sentences) > 1:
            return "Tôi không biết phải bắt đầu từ đâu cả. Tôi không thể xử lý nhiều câu hỏi cùng lúc :("
        
        # Push in queues:
        self.raw_queue.append(input_str)
        self.vec_queue.append(self.preprocessor.transform(pd.Series(input_sentences)))

        # Process queues:
        X = self.vec_queue[0]
        self.state['context'] = (self.context_clf.predict(X)[0], np.max(self.context_clf.decision_function(X)))
        self.state['intent'] = (self.intent_clf.predict(X)[0], np.max(self.intent_clf.decision_function(X)))

        # Empty queues:
        self.raw_queue = []
        self.vec_queue = []

        # Get answer:
        answer = ''
        return self.state

if __name__ == "__main__":
    bot_instance = codebot()
    running = True
    while running:
        try:
            print(bot_instance.answer(input()))
        except Exception as ex:
            running = False
            print(bot_instance.raw_queue, bot_instance.state)
            print("An error has occured! Here is the error details:")
            try:
                traceback.print_tb(ex.__traceback__, file=sys.stdout)
                print(ex)
            except Exception as another_ex:
                print("Another error has occured::", another_ex)
        finally:
            pass
