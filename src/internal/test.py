#encoding=utf-8
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
import web

class index:
    def GET(self):
        return "Hello, world! 57"

class Portal:
    def __init__(self):
        self.urls = (
                        '/test', 'index'
                    )
        self.app = web.application(self.urls, globals())
