const PATH = "m/44'/60'/0'/0/0"

const users = [
  {
    username: 'email@address.com',
    password: 'testpassword',
    walletAddress: '0x7c47632073388ae968d30f6c060494fc0cfb4207',
    lookupKey: '18c6f07f7b891bc5f2c79a20bd39f7971a499f3e7ada02cb2382d40e44661b92',
    entropy: '62f6be1cb96587d7fd09808a0c095522',
    ivHex: 'e85bf7579aafe1554c6d0e5235a4a883',
    keyHex: 'ef8457b244f144ba12afed55c8812da2898cea4331f9c53ed8eb791bba44aec5',
    cipherTextHex: '6b6cd020f0e50105fa4d7ba074c60f4b3f56a85739b734164fba6d30954d45f925ab5cd68a7c3d0270d58f8ee318d69b088998a4190c69b4692e45298a2fdb77'
  },
  {
    username: 'test@test2.com',
    password: 'testpassword',
    walletAddress: '0x900dfaf7c2e68a7390eccbb200cd8322a9426a58',
    lookupKey: '06b52a1cadb6dacfd884eb05077283615089da28c6ebe6d46296742388e5e97a',
    ivHex: '52eda800b334f689c009ba0d7442adf3',
    cipherTextHex: '0892a82c9e9e285c6bd4172b046bb827195d51000016ddcdd8c82895684636c0b8a8d5faae171704b871abfd39d52956a89911b4788087208b7e0c5b6ed642c9'

  }
]

module.exports = { PATH, users, ...users[0] }
