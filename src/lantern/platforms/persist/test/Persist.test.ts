import { Persist } from "../common/Persist";
import { expect } from "chai";

interface User {
  username: string;
  password: string;
  address?: string;
}

describe(`Persist`, () => {
  let _numberPersist: Persist<number> = new Persist(0.5);
  let initialDataUser = {
    username: "guys",
    password: "1234",
    address: "guys street",
  };
  let _objectPersist: Persist<User> = new Persist(initialDataUser);
  it(`Successfully store the data`, () => {
    expect(_numberPersist.data).to.not.be.undefined;
    expect(_numberPersist.data).to.equal(0.5);

    expect(_objectPersist.data).to.not.undefined;
    expect(_objectPersist.data).to.eq(initialDataUser);
  });
  it(`Successfully change the data inside persist class`, () => {
    _numberPersist.setData(12e9);
    expect(_numberPersist.data).to.eq(12e9);

    _objectPersist.setData({ ..._objectPersist.data, address: undefined });
    // console.log(_objectPersist.data);
    expect(_objectPersist.data.address).to.be.undefined;
  });
});
