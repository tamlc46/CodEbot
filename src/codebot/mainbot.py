# -*- coding: utf-8 -*-

import os
import re
from utilities import *
import joblib

class codebot:
    def __init__(self, kbmodel_dir_path=""):
        if kbmodel_dir_path == "":
            kbmodel_dir_path = os.path.dirname(
                os.path.abspath(__file__)) + "/KB"
        
        # Knowledge base:
        # self.kb = read_json(f'{kbmodel_dir_path}/knowledge.json')  # kb[term][context][intent]
        # self.rb = read_json(f'{kbmodel_dir_path}/response.json')   # rb[relevance][intent]

        # Preprocessing Model:
        self.preprocessor = None

        # Linear Support Vector Classifiers:
        self.intent_clf = None
        self.relevance_clf = None
        self.context_clf = None

        # State Information:
        self.input_queue = []
        self.state = {
            'context': 'general',   # Context is for looking up the right entity in kb
            'relevance': False,     # Relevance is whether the input was about programming or not
            'intent': None          # Intent of user
        }
    
    def __repr__(self):
        return '<%s.%s object at %s>' % (
            self.__class__.__module__,
            self.__class__.__name__,
            hex(id(self))
        )

    def read(self, input_str):
        pass

    def answer(self):
        return "Seen!"
    

if __name__ == "__main__":
    bot_instance = codebot()
    while True:
        bot_instance.read(input())
        print(bot_instance.answer())
