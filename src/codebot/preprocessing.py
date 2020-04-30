import os
import errno
import shutil
import time
import random
import re

import pandas as pd
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from underthesea import word_tokenize

import joblib

class Preprocessing:
    def __init__(
            self, input='content', encoding='utf-8', decode_error='strict', strip_accents=None, 
            lowercase=True, preprocessor=None, tokenizer=None, analyzer='word', stop_words=None, 
            token_pattern='(?u)\b\w\w+\b', ngram_range=(1, 1), max_df=1.0, min_df=1, max_features=None, 
            vocabulary=None, binary=False, dtype=np.float64, norm='l2', use_idf=True, smooth_idf=True, 
            sublinear_tf=False):
        if (tokenizer == None):
            self._tokenizer = word_tokenize
        else:
            self._tokenizer = tokenizer
        
        self._vectorizer = TfidfVectorizer(
            input=input, encoding=encoding, decode_error=decode_error, strip_accents=strip_accents, 
            lowercase=lowercase, preprocessor=preprocessor, tokenizer=self._tokenizer, analyzer=analyzer, 
            stop_words=stop_words, token_pattern=token_pattern, ngram_range=ngram_range, 
            max_df=max_df, min_df=min_df, max_features=max_features, vocabulary=vocabulary, binary=binary, 
            dtype=dtype, norm=norm, use_idf=use_idf, smooth_idf=smooth_idf, sublinear_tf=sublinear_tf)
        
    def fit(self, df):
        self._vectorizer.fit(self.optional_preprocess(df))
        return self
    
    def fit_transform(self, df):
        return self._vectorizer.fit_transform(self.optional_preprocess(df))
        
    def transform(self, df):
        """
        Vectorize Pandas DataFrame
        """
        return self._vectorizer.transform(self.optional_preprocess(df))
    
    def optional_preprocess(self, df):
        return df.apply(lambda q: re.sub('[cC]\+\+', 'cpp', q))
    
    def save(self, file_name):
        print("Saving model to ", file_name)
        return joblib.dump(self, file_name)
        
    @staticmethod
    def load(file_name):
        if (isinstance(file_name, str) and os.path.isfile(file_name)):
            self = joblib.load(file_name)
        else:
            raise FileNotFoundError(errno.ENOENT, os.strerror(errno.ENOENT), file_name)
        return self