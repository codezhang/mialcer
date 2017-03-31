#encoding=utf-8
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
import web, threading, time
from file_watcher import FileWatcher
from module_maintainer import ModuleMaintainer
from request_thread_pool import RequestThreadPool
p = None
fw = None
rtp = RequestThreadPool()
m = ModuleMaintainer()

class index:
    def GET(self):
        return "Hello, world!"

class plugin:
    def GET(self, path):
        def sub_app_request(sub_app, path):
            return sub_app.request(path).data
        try:
            module_name = path.split('/')[0]
            rid, semaphore = rtp.new_request()
            rtp.request(rid, sub_app_request, (p.sub_app[module_name], '/' +\
              '/'.join(path.split('/')[1:])), semaphore)
            semaphore.acquire()
            return rtp.fetch_result(rid)
        except Exception, e:
            import traceback
            traceback.print_exc()
            return 'can not handle ' + path

def handle_file_create(event):
    global p
    global fw
    new_module_name = m.put_module(event.src_path)
    if new_module_name == None:
        return
    _, module, _ = m.module_map[new_module_name]
    entry_class = getattr(module, 'Portal', None)
    p.sub_app[new_module_name] = entry_class().app

def handle_file_update(event):
    global p
    global fw
    module_name = m.reload_module(event.src_path)
    if module_name == None:
        return
    _, module, _ = m.module_map[module_name]
    entry_class = getattr(module, 'Portal', None)
    p.sub_app[module_name] = entry_class().app

def handle_file_destroy(event):
    global p
    global fw
    del m.reverse_map[event.src_path]
    module_name = m.module_name_for_path(event.src_path)
    if module_name == None:
        return
    del m.module_map[module_name]
    del p.sub_app[module_name]

class Portal:
    def __init__(self):
        self.urls = (
            '/', 'index',
            '/api/(.+)', 'plugin'
        )
        class PortalApplication(web.application):
            def run(self, port = 8080, *middelware):
                func = self.wsgifunc(*middelware)
                return web.httpserver.runsimple(func, ('0.0.0.0', port))
        self.app = PortalApplication(self.urls, globals())
        session = web.session.Session(self.app,\
          web.session.DiskStore('sessions'),\
          initializer = {'params_index': 0})
        def session_hook():
            web.ctx.session = session
        session_preprocessor = web.loadhook(session_hook)
        self.app.add_processor(session_preprocessor)
        self.sub_app = {}


if __name__ == "__main__":
    p = Portal()
    fw = FileWatcher(file_create_listener = handle_file_create,\
      file_change_listener = handle_file_update,\
      file_destroy_listener = handle_file_destroy)
    fw.start()
    p.app.run(8888)
    fw.stop()
    rtp.stop_all()
