import threading, time, uuid
class RequestThreadPool:
    def __init__(self, limit = 512, scan_seconds = 0.05):
        """
        request_map
        key: thread uuid
        value: request func, parameters, semaphore
        """
        self.request_map = {}
        """
        result_map
        key: thread uuid
        value: result
        """
        self.result_map = {}
        self.limit = limit
        self.command_map = {'run': True}
        self.scan_seconds = scan_seconds
        self._thread_loop()
    def new_request(self):
        return str(uuid.uuid1()), threading.Semaphore(0)
    def request(self, rid, func, parameters, semaphore):
        self.request_map[rid] = (func, parameters, semaphore)
    def _thread_loop(self):
        def execute_request(request, execution_map, request_id, result_map):
            func, parameters, semaphore = request
            result = func(*parameters)
            result_map[request_id] = result
            del execution_map[request_id]
            semaphore.release()
        def scan_request_map(request_map, limit, command,\
          result_map, scan_seconds):
            execution_map = {}
            while command['run'] == True:
                for request_id, request in request_map.items():
                    if len(execution_map.keys()) >= limit:
                        break
                    if request_id in execution_map:
                        continue
                    execution_map[request_id] = 0
                    threading.Thread(target = execute_request,\
                      args = (request, execution_map,\
                      request_id, result_map)).start()
                    del request_map[request_id]
                time.sleep(scan_seconds)
        threading.Thread(target = scan_request_map, args = \
          (self.request_map, self.limit, self.command_map,\
          self.result_map, self.scan_seconds)).start()
    def fetch_result(self, rid):
        result = self.result_map[rid]
        del self.result_map[rid]
        return result
    def stop_all(self):
        self.command_map['run'] = False
