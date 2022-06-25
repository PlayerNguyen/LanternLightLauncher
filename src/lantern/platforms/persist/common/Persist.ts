export class Persist<T> {
  data: T;
  constructor(initialData: T) {
    this.data = initialData;
  }

  public setData(data: T) {
    this.data = data;
  }
}
