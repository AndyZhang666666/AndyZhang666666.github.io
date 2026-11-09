const DATABASE='tasteroom-artwork-images-v1',TABLE='images';
let database;
function open(){if(!globalThis.indexedDB)return Promise.reject(Error('本机图片存储不可用；图片仍可在本次会话编辑和导出。'));return database||=(new Promise((resolve,reject)=>{const request=indexedDB.open(DATABASE,1);request.onupgradeneeded=()=>request.result.createObjectStore(TABLE,{keyPath:'id'});request.onerror=()=>reject(Error('本机图片存储无法打开；原作品未清除。'));request.onsuccess=()=>resolve(request.result);}));}
async function transaction(mode,op){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(TABLE,mode),request=op(tx.objectStore(TABLE));tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(Error('本机图片存储失败；原作品与记忆保留。'));tx.onabort=()=>reject(Error('图片保存被中断，请重新选择。'));});}
export const storeImage=image=>transaction('readwrite',store=>store.put(image));
export const readImage=id=>transaction('readonly',store=>store.get(id));
export const clearImages=()=>transaction('readwrite',store=>store.clear());
export async function imageFromFile(file){
 if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('请选择 JPG、PNG 或 WebP 图片；不读取 SVG 或远程图片。');
 if(file.size>5*1024*1024)throw Error('图片最大5MB，原图片和当前作品保留。');
 const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('图片读取失败，原作品保留。'));reader.readAsDataURL(file);});
 const decoded=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('这份文件不能作为图片解码，原作品保留。'));img.src=dataUrl;});
 if(decoded.naturalWidth*decoded.naturalHeight>50000000)throw Error('图片像素过大，请缩小后再试（最多5000万像素）。');
 return {id:crypto.randomUUID(),type:file.type,width:decoded.naturalWidth,height:decoded.naturalHeight,dataUrl};
}
