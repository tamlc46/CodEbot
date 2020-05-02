# -*- coding: utf-8 -*-

import os
import errno
import shutil
import time
import random
import re
import sys
import traceback
import string
import json

import joblib
import pandas as pd
import numpy as np

from random import choice
from preprocessing import *
from utilities import *

class codebot:
    def __init__(self):
        self.__path = os.path.dirname(os.path.abspath(__file__))
        self.__load_KB()
        self.__load_models()

        self.raw_stack = []
        self.vec_stack = []
        
        self.intent = None          # Intent of user
        self.context = None         # Context is for looking up the exact language in kb

        self.low_conf_accept = False
    
    def __repr__(self):
        return '<%s.%s object at %s>' % (
            self.__class__.__module__,
            self.__class__.__name__,
            hex(id(self))
        )
    
    def __load_KB(self):
        self.kb = read_json(f'{self.__path}/model/knowledge.json')
        self.rb = read_json(f'{self.__path}/model/response.json')
        self.ir = read_json(f'{self.__path}/model/intent_rules.json')
        self.cr = read_json(f'{self.__path}/model/context_rules.json')

    def __load_models(self):
        # Preprocessing Model:
        self.preprocessor = joblib.load(f'{self.__path}/model/preprocessing.bin')

        # Linear Support Vector Classifiers:
        self.intent_clf = joblib.load(f'{self.__path}/model/model_intent.bin')
        self.context_clf = joblib.load(f'{self.__path}/model/model_context.bin')
    
    def __read_input(self, input_str):
        self.raw_stack.append(input_str)
        self.vec_stack.append(self.preprocessor.transform(pd.Series(input_str)))
    
    def __clean_up(self):
        if self.intent != 'low_conf':
            self.raw_stack.pop()
            self.vec_stack.pop()

    def __get_intent(self):
        X = self.vec_stack[-1]
        return {
            'name': self.intent_clf.predict(X)[0],
            'conf': np.max(self.intent_clf.decision_function(X))
        }
    
    def __get_context(self):
        X = self.vec_stack[-1]
        return {
            'name': self.context_clf.predict(X)[0],
            'conf': np.max(self.context_clf.decision_function(X))
        }
    
    def __parse_rb(self, response):
        if '$' not in response:
            return response[0].upper() + response[1:]
        replaces = dict(
            (w, choice(self.rb[w])) 
            for w in response.translate(str.maketrans('', '', string.punctuation.replace('$',''))).split() 
            if w[0] == '$' and w in self.rb)
        for key in replaces:
            response = response.replace(key, replaces[key])
        return self.__parse_rb(response)
    
    def __get_kb(self, input_str):

        pass

    def __intent_infer(self, cur_intent):
        if self.intent in self.ir and cur_intent in self.ir[self.intent]:
            return self.ir[self.intent][cur_intent]
        return cur_intent

    def __context_infer(self, cur_context):
        if self.context in self.ir and cur_context in self.cr[self.context]:
            return self.ir[self.context][cur_context]
        return cur_context

    def __get_response(self):
        # Intent:
        intent = self.__get_intent()
        if intent['conf'] >= 0.0 or self.low_conf_accept:
            self.low_conf_accept = False
            self.intent = self.__intent_infer(intent['name'])
        elif intent['name'] in self.rb['low_conf']:
            self.intent = self.__intent_infer('low_conf')
        else:
            self.intent = 'other'

        # Context:
        context = self.__get_context()
        if context['conf'] >= 0.0:
            self.context = self.__context_infer(context['name'])
        else:
            self.context = self.__context_infer('low_conf')

        # Low_conf:
        if self.intent == "agree":
            self.low_conf_accept = True
        else:
            self.low_conf_accept = False

        # Build answers:
        answer = ''
        rb_intent = self.rb[self.intent]
        
        if self.intent != "low_conf":
            if isinstance(rb_intent, list):
                answer = choice(rb_intent)
            else:
                answer = choice(rb_intent[self.context])
        else:
            rb_intent_lc = rb_intent[intent['name']]
            if isinstance(rb_intent_lc, list):
                answer = choice(rb_intent_lc)
            else:
                answer = rb_intent_lc

        if isinstance(answer, list):
            final_answer = [self.__parse_rb(sen) for sen in answer]
        else:
            final_answer = [self.__parse_rb(answer)]
        
        # print(self.intent, intent, self.low_conf_accept, sep='\n')
        
        self.__clean_up()
        return final_answer
        
    def answer(self, input_str):
        self.__read_input(input_str)
        answers = []
        answers.extend(self.__get_response())
        if len(self.raw_stack) and self.intent == 'agree':
            answers.extend(self.__get_response())
        return json.dumps(answers, ensure_ascii=False)

if __name__ == "__main__":
    try:
        # Set terminal encoding to utf-8
        sys.stdin.reconfigure(encoding='utf-8')
        sys.stdout.reconfigure(encoding='utf-8')

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
