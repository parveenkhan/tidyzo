import WebApi from '../../NetworkController/WebApi';
import { Service } from '../../Assets/Types';

class ServiceApi {
  static list() {
    return WebApi.get<{ ok: boolean; services: Service[] }>('/api/v1/services');
  }
}

export default ServiceApi;
