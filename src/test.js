import NP from 'number-precision'

console.log(typeof NP.plus(...['22'])) // string
console.log(typeof NP.plus('22')) // string
console.log(typeof NP.plus(...['22', '33'])) // number
