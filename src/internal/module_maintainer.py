import os, shutil, time, imp
class ModuleMaintainer:
    def __init__(self):
        self.module_map = {}
    def modules(self):
        return [m for (_, m, _) in self.module_map.values()]
    def load_module(self, path, module_name):
        m = None
        try:
            m = imp.load_source(module_name, path)
            """
            for item in m.global_imports:
                m._import(item)
            """
        except Exception, e:
            import traceback
            traceback.print_exc()
            #pass
        return m
    def put_module(self, path, module_name = None):
        if not path.endswith('.py'):
            return None
        if module_name == None:
            module_name = os.path.split(path)[1]
            if module_name.endswith('.py'):
                module_name = module_name[:-3]
        if module_name in self.module_map:
            return None
        module = self.load_module(path, module_name)
        if module == None:
            return None
        self.module_map[module_name] = (path, module, time.localtime())
        return module_name
    def drop_module(self, module_name, remove_file = False):
        if module_name not in self.module_map:
            return None
        path, module, _ = self.module_map[module_name]
        del self.module_map[module_name]
        if remove_file == True:
            try:
                shutil.rmtree(path)
            except Exception:
                pass
        return module_name
