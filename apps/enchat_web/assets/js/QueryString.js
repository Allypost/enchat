export class QueryString {
  static getParameters(str = '') {
    const query = str || window.location.search;
    
    if (query === '') {
      return {};
    }
    
    return query
      .slice(1)
      .split('&')
      .map((part) => part.split('='))
      .reduce((acc, [key, value]) => {
        if (Object.prototype.hasOwnProperty.call(acc, key)) {
          if (!Array.isArray(acc[key])) {
            acc[key] = [acc[key]];
          }

          acc[key].push(value);
        } else {
          acc[key] = value;
        }

        return acc;
      }, {});
  }

  static getParameter(name, str = '') {
    const params = this.getParameters(str);
    
    return params[name];
  }
}
