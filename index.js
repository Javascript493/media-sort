// 批量的获取路径下所有的照片，将照片按对象的形式进行分类key-时间， 照片信息

//todo AAE文件时什么 是否需要同时迁入或者删除呢？
const fs = require('fs')
const Path = require('path')
const Exifr = require('exifr') // 不可获取视频
const moment = require('moment')
const Exiftool = require("exiftool-vendored").exiftool

const filePath = 'D:/demo-sort'
const imgReg = /\.(jpeg|jpg|gif|png|heic)$/i
const movReg = /\.(mp4|avi|mov|mkv|flv|wmv|webm|hevc)$/i
let files = fs.readdirSync('D:/demo-sort') // 所有文件
let filesAll = fs.readdirSync('D:/demo-sort') // 所有文件
const promistList = []
const getExifr = (file) => {
    // 获取照片信息
    return new Promise((resolve) => {
      Exiftool.read(file).then((res)=> {
        //res.SourceFile // 源文件'D:/demo-sort/IMG_1979.HEIC'
        //FileName 文件名
        resolve(res)
      })
    })
}

// 创建对应目录
const newFile = (path) => {
  fs.mkdirSync(path)
}

files = files.filter(file => {
  return fs.statSync(Path.join(filePath, file)).isFile() && (movReg.test(file) || imgReg.test(file))
})
files.forEach(file => {
  promistList.push(getExifr(Path.resolve(filePath, file)))
})

const imgObj = {} 
Promise.all(promistList).then(res=>{
  res.forEach(exif => {
    let valueTime =''
    if (movReg.test(exif.FileName)) {
      valueTime = exif.CreateDate && exif.CreateDate.rawValue
    } else if(imgReg.test(exif.FileName)) {
      valueTime = exif.DateTimeOriginal && exif.DateTimeOriginal.rawValue
    }
    if(valueTime) {
      const key = moment(valueTime, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD')
      const name = exif.FileName.split('.')[0]
      if(imgObj[key]) {
        imgObj[key].push({fileName: exif.FileName, name})
      } else {
        imgObj[key] = [{fileName: exif.FileName, name}]
      }
    }
  })
  
  // 处理文件
  for (const path in imgObj) {
    newFile(Path.resolve(filePath, path))
    const childrens = imgObj[path] || []
    childrens.forEach(file => {
      const fileName = file.fileName
      const name = file.name
      const expandName = name + '.AAE'
      fs.copyFileSync(Path.join(filePath, fileName), Path.join(filePath, path, fileName))
      if(filesAll.includes(expandName)) {
        fs.copyFileSync(Path.join(filePath, expandName), Path.join(filePath, path, expandName))
      }
      // fs.renameSync(Path.join(filePath, name), Path.join(filePath, path, name)) // 移动
    })
  }
  Exiftool.end()
})

// 第一种方法
// const getExifr = (file, name) => {
//   // 获取照片信息
//   return new Promise((recolve) => {
//     Exifr.parse(file).then(res =>{
//       res.name = name
//       recolve(res)
//     })
//   })
// }