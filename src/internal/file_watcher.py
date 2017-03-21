import sys, os, threading, time
from watchdog.observers import Observer
from watchdog.events import LoggingEventHandler
class FileWatcher:
    def __init__(self, target = None,\
      file_create_listener = None,\
      file_change_listener = None,\
      file_destroy_listener = None,\
      file_move_listener = None):
        self.handler = LoggingEventHandler()
        self.target = target
        if self.target == None:
            self.target = os.path.dirname(__file__)
        def wrap_listener(obj, listener_name, listener):
            raw_listener = getattr(obj, listener_name)
            def new_listener(event):
                if listener != None:
                    listener(event)
                raw_listener(event)
            setattr(obj, listener_name, new_listener)
        for (func_name, func) in [\
          ('on_created', file_create_listener),\
          ('on_deleted', file_destroy_listener),\
          ('on_modified', file_change_listener),\
          ('on_moved', file_move_listener)]:
            wrap_listener(self.handler, func_name, func)
    def start(self):
        self.observer = Observer()
        def observe(observer, handler, path):
            observer.schedule(handler, path, recursive = True)
            observer.start()
            while self.observer != None:
                time.sleep(1)
            observer.join()
        threading.Thread(target = observe,\
          args=(self.observer, self.handler, self.target)).start()
    def stop(self):
        if self.observer != None:
            self.observer.stop()
            self.observer = None
