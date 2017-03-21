#encoding=utf-8
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
import web, threading, time
from file_watcher import FileWatcher
from module_maintainer import ModuleMaintainer
p = None
fw = None
x = None
class index:
    def GET(self):
        return "Hello, world!"
def request_sub_app(module_name, path):
    global x
    x = p.sub_app[module_name].request(path).data
class plugin:
    def GET(self, path):
        global x
        module_name = path.split('/')[0]
        print module_name, p.sub_app
        if module_name in p.sub_app:
            threading.Thread(target = request_sub_app,\
              args=(module_name, '/' + '/'.join(path.split('/')[1:]))).start()
            limit = 120
            while x == None and limit > 0:
                time.sleep(1)
                limit -= 1
            if x == None:
                return "error"
            else:
                temp_x = x
                x = None
                return temp_x
        return 'can not handle ' + path
m = ModuleMaintainer()
def handle_file_create(event):
    global p
    global fw
    new_module_name = m.put_module(event.src_path)
    if new_module_name == None:
        return
    _, module, _ = m.module_map[new_module_name]
    entry_class = getattr(module, 'TestPortal', None)
    p.sub_app[new_module_name] = entry_class().app
class Portal:
    def __init__(self):
        self.urls = (
            '/', 'index',
            '/api/(.+)', 'plugin'
        )
        self.app = web.application(self.urls, globals())
        session = web.session.Session(self.app, web.session.DiskStore('sessions'), initializer = {'params_index': 0})
        def session_hook():
            web.ctx.session = session
        session_preprocessor = web.loadhook(session_hook)
        self.app.add_processor(session_preprocessor)
        self.sub_app = {}

if __name__ == "__main__":
    p = Portal()
    fw = FileWatcher(file_change_listener = handle_file_create)
    fw.start()
    p.app.run()
    fw.stop()
