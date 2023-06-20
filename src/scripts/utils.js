import { toBigIntBE, toBufferBE,toBigIntLE,toBufferLE } from "bigint-buffer";
import {Socket} from 'engine.io-client'
import Cookies from "js-cookie";
import CryptoJS, { mode } from "crypto-js";
import { addUser, pushMessage, setReady, setUserState ,setMessageState, setUserLastMessage, setConnectionState} from "../state/slices/userSlice";
import store from "../state/store";
import Dexie from "dexie";
const ec = require('elliptic').ec('p256');


let authKey = '';
let encKey = '';
let interm = null;
let token = '';
let a = 3003n;
let keyStore = null;
let initiated = 0;
let globalSocket = null;
let globalDb = null;
let user_id = null;
let usersDb = null;
let p =   5210644015679228794060694325390955853335898483908056458352183851018372555735221n;
// let senderid = 120;
let activeChat = {};
const ivs = [
  '101112131415161718191a1b1c1d1e1f',
  'ab11121ed415161718191afb1c1d1e1f',
  '10ee121314ef16aa181cca1b1c1d1e1f',
  '10ef12ca141516ff18191a1b1c1d1e1f',
  '1fa11213fe151617ee191a1b1c1d1e1f',
  '1bb11aa314ac51ef718191a1b1c1d1e1f',
  '1afe1b13141d1e1718d91aeb1cad1e1f',
  'af11cd13ea15161718ee1a1b1c1d1e1f',
]

class User{
  
  constructor(obj){
    this.user_id = obj.user_id ;
    
    // store.getState().users.users.forEach((e)=>{
    //   console.log("found user : " + e.user_id + ":" + this.id);
    //   // console.log(...e);
    // })
    // let u = store.getState().users.users.find((s)=> s.user_id == this.id);
    this.public = obj.public;
    this.profile_photo = obj.profile_photo;
    // this.msgDB = new Dexie('localdata/'+this.id);
    // this.msgDB.version(1).stores({
    //   messages:'++id,type,timestamp,state'
    // });
    this.lastMsgId = new Promise((resolve,reject)=>{
      try{
        globalDb.messages.where('senderId').equals(this.user_id).last().then((obj)=>{
          if(obj)
       resolve(obj.id);
          else
        resolve(0)
        });
      }
      catch(e){
      reject(e);
      }
     
    })
    
    this.key = new Promise((resolve,reject)=>{
      try{
        keyStore.keys.toArray().then((data)=>{
          let privKey = data[0].private;
          let me = ec.keyFromPrivate(privKey,"hex");
          let lkey = me.derive(ec.keyFromPublic(this.public,"hex").getPublic()).toString("hex");
          console.log("derived key : " + lkey);
         resolve(lkey)
        });
      }
      catch(e){
reject(e)
      }
    
    });
   
    
  
     
  }
NotifyMessageRead(id)
{
//  let buf = structureMessage(1,'08c5a54e766e56a6f8430524d46fb0fee37b775701c44995daaf36640e33d265' || getAuthKey(),Cookies.get('capp_id'),this.id,MessageTypes.MessageRead,new Uint32Array([id]).buffer)
console.log("Noftifying message read for user " + this.user_id + "and id " + id);
// this.sendMessage(new Uint8Array(new Uint32Array([id]).buffer),MessageTypes.MessageRead);
let buf = Buffer.concat([
  new Uint8Array([1]),
  new Uint8Array(new Uint32Array([id]).buffer),
  new Uint8Array(32),// TODO : Replace with auth key later
  Buffer.from(Cookies.get('capp_id'),"hex"),
  Buffer.from(this.user_id,"hex"),
  toBufferBE(BigInt(Date.now()),8),
  new Uint8Array([MessageTypes.MessageRead]),
  new Uint8Array(new Uint16Array([4]).buffer),
  new Uint8Array(new Uint32Array([id]).buffer),
  // new Uint8Array([0]),
]);
// console.log("got buf : \n" + buf.toString("hex"))

encryptAndSendMessage(buf);

}
  
  // constructor(id,public){
  //   this.public = public;
  //   this.id = id;
  //   let me = crypto.createECDH('prime256v1');
  //   let privKey = keyStore.keys.toArray()[0].private;
  //   me.setPrivateKey(Buffer.from(privKey,'hex'));
  //   let enckey = me.computeSecret(this.public).toString('hex');
  //   this.key = enckey;
  // }

  async encryptMessage(payload){
    let iv = CryptoJS.lib.WordArray.random(16);
  let key = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(await this.key));
  let wa = BuftoWA(payload);
  console.log('encrypting with key : ' + key.toString(CryptoJS.enc.Hex) + " : " +this.key + "and iv  " + iv.toString(CryptoJS.enc.Hex));
  let ct = CryptoJS.AES.encrypt(wa,key,{
    iv:iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding,
  
  });
  // return WAtoBuf(ct);
  
  return Buffer.concat([WAtoBuf(iv),WAtoBuf(ct.ciphertext)]);
  
  }
 async decryptIncomingMessage(data)
  {

    let headWA = BuftoWA(data.subarray(16,16+97)); // size of head 
    let msgWA = BuftoWA(data.subarray(16+97,data.length-32));
    let sig = BuftoWA(data.subarray(data.length-32));
    let headKey = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(getEncKey()));
   
    let iv = BuftoWA(data.subarray(0,16));
    let key = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(await this.key));
    let headpt = CryptoJS.AES.decrypt(headWA,headKey,{
      iv:iv,
      mode:CryptoJS.mode.CBC,
      padding : CryptoJS.pad.NoPadding,
    });
    let msgpt = CryptoJS.AES.decrypt(msgWA,key,{
      iv:iv,
      mode:CryptoJS.mode.CBC,
      padding:CryptoJS.pad.NoPadding,
    });
    let msgsig = CryptoJS.HmacSHA256(msgpt,this.public);
    if (sig.toString(CryptoJS.enc.Hex) === msgsig.toString(CryptoJS.enc.Hex)){
      let resBuf = Buffer.concat([WAtoBuf(headpt),WAtoBuf(msgpt)]);
      return resBuf; 
    }
    console.log("Warning hmac not identical");
    let resBuf = Buffer.concat([WAtoBuf(headpt),WAtoBuf(msgpt)]);
   return resBuf; 
  }
  async sendMessage(payload,type){
    // let iv = BuftoWA(data.subarray(0,16))
    
    let iv = CryptoJS.lib.WordArray.random(16);
    let piv = CryptoJS.lib.WordArray.random(16);
    let key = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(await this.key));
    console.log("encrypting for : " + this.user_id + "with key : " + key.toString(CryptoJS.enc.Hex) + " and iv : " +  iv.toString(CryptoJS.enc.Hex));
    let wa = BuftoWA(Buffer.from(payload,"utf8"));
    let ct = CryptoJS.AES.encrypt(wa,key,{
      iv:piv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.NoPadding,
    
    });
    // let pbuf = WAtoBuf(ct.ciphertext);
    // console.log("got payload ciphertext : \n" + ct.ciphertext.toString(CryptoJS.enc.Hex));
    let sig = CryptoJS.HmacSHA256(payload.toString('base64'),this.public);
    // console.log("with sig : " + sig.toString(CryptoJS.enc.Hex) + "\nlength : " + sig.words.length*4);
    let ver = Buffer.from('01','hex');
    let msgid = new Uint8Array(new Uint32Array([await this.lastMsgId]).buffer);
    let senderId = Buffer.from(Cookies.get('capp_id'),'hex');
    let receiverId = Buffer.from(this.user_id,'hex');
    let auth = Buffer.from(getAuthKey(),'hex');
    let ts = toBufferBE(BigInt(Date.now()),8);
    let pl = new Uint8Array(new Uint16Array([payload.length]).buffer);
    let t = new Uint8Array([type]);
    console.log("pl : " + pl +"ver : " +ver.toString("hex") +"\nsid : " + senderId.toString("hex") + "\nrid : " + receiverId.toString("hex") + "\ntype : " + t.toString("hex") +"\nts :" + ts.toString("hex") + "\nauth : " + auth.toString("hex") + "\nsig : " + sig.toString(CryptoJS.enc.Hex))
    let headBuf = Buffer.concat([ver,msgid,auth,senderId,receiverId,ts,t,pl]);

    let headWA = BuftoWA(headBuf);
    // console.log("head buf : " + headBuf.toString("hex") + "\nwith length" + headBuf.length);
    // console.log("head WA :  " + headWA.toString(CryptoJS.enc.Hex) + "\nwith length " + headWA.words.length * 4);
    let headKey = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(getEncKey()));
    // console.log('encrypting with key : ' + headKey.toString(CryptoJS.enc.Hex) + " : " +getEncKey() + "and iv  " + iv.toString(CryptoJS.enc.Hex));

    let headCt = CryptoJS.AES.encrypt(headWA,headKey,{
      iv:iv,
      padding:CryptoJS.pad.NoPadding,
      mode:CryptoJS.mode.CBC,
    });
    let resBuf = Buffer.concat([new Uint8Array(new Uint16Array([192]).buffer),WAtoBuf(iv),WAtoBuf(headCt.ciphertext),WAtoBuf(piv),WAtoBuf(ct.ciphertext),WAtoBuf(sig)]);
    // console.log("got buffer : \n" + resBuf.toString("hex") + "with length : " + resBuf.length);
    if(globalSocket){
      if(globalSocket.readyState != WebSocket.CLOSED){
        globalSocket.send(resBuf);
       let id = await globalDb.messages.add({direction:"out",senderId:this.user_id,type:type,timestamp:Date.now(),payload:payload,state:'sent'})
       store.dispatch(pushMessage({id:id,payload:payload,type:type,senderId:this.user_id,timestamp:Date.now(),direction:"out",state:"sent"}))
      }
      else{
       let id = await globalDb.messages.add({direction:"out",senderId:this.user_id,type:type,timestamp:Date.now(),payload:payload,state:'unsent'})
       store.dispatch(pushMessage({id:id,payload:payload,type:type,senderId:this.user_id,timestamp:Date.now(),direction:"out",state:"unsent"}))

      }
    }
    else{
      throw 'Error: socket not initialized'
    }
  }
  }
  
function setInterm(a)
{
interm = a;
}
function getInterm()
{
  return interm;
}
function setActiveChat(id)
{
  activeChat = id;
}
function getActiveChat()
{
  return activeChat;
}
function setToken(t)
{
  token = t;
}
function getToken()
{
  return token;
}
let outgoing_queue;
let incoming_queue;
function getAuthKey() {
  return authKey;
}
function getEncKey() {
  return encKey;
}
function setAuthKey(key) {
  //Test if it is a TypeArray
 authKey = key
}
function setEncKey(key) {
encKey = key;
  
}
function addToMessageQueue_Incoming(msg) {
  // TODO type safety checks
  incoming_queue = msg;
  return;
}

function getFromMessageQueue_Incoming() {
  // TODO type safety checks
  return incoming_queue;
}
window.ononline = (ev)=>{
  
}

function addToMessageQueue_Outgoing(msg) {
    // TODO type safety checks
    outgoing_queue.insertElement(msg);
    return;
  }
  function getFromMessageQueue_Outgoing() {
    // TODO type safety checks
    return outgoing_queue.getElement();
  }
  const errors = {
    CHAT_APP_OK:0,
    EMAIL_USED :5,
    INTERNAL_ERROR:500,
    INCORRECT_PASSWORD:2,
    INVALID_EMAIL:3,
    INVALID_CODE:4,
    NO_ACCOUNT:6,
  }
const MessageTypes = {
  Text: 0,
  Image: 1,
  Voice: 2,
  MessageDeleivered: 3,
  MessageRead: 4,
  
  EncKeyRequest: 5,
  AuthKeyRequest: 6,
  EncKeyResponse: 7,
  AuthKeyResponse: 8,
  UserTyping:10,
  UserConnected:11,
  UserDisconnected:12,
  File:13,
  MessageReceived : 9,
};

class Message {
  id;
  ver;
  authKey;
  senderId;
  recieverId;
  timestamp;
  type;
  payload;
  sig;

  constructor() {}
}
function verifySignature(){

}
async function destructureMessage(data,iv = null ,pd = null) {
  //TDOD: Store directly in msgObj
  let msgObj = new Message(); // |     Header      |      payload      |
  //  --------108 Bytes- -- 0 - 65535 Bytes--
  if(iv && pd){
    try {
      // console.log("dm : data length : " )
      let helper = data;
      let ver = helper[0];
      let id = new Uint32Array(Uint8Array.from(helper.slice(1, 5)).buffer)[0]; // 32 Bytes for authKey
      let auth = helper.slice(5, 37); // 4 Bytes for id
      let sender = helper.slice(37, 69); // 32 Bytes for sender id
      let receiver = helper.slice(69, 101); // 32 Bytes for receiver
      let timeStamp =toBigIntBE(helper.slice(101, 109)); // 8 Bytes for timestamp
      // console.log('dm : timestamp : ' + timeStamp);
      console.log("dm : id " + id);
      // let chunk = new Uint8Array(new Uint32Array(helper.slice(14, 15)).buffer);
      // let type = chunk.slice(56, 57)[0]; // 1 Byte for type
      let type = data[109];
      console.log('dm : type : '+ type);
      let payloadLength = new Uint16Array(helper.slice(110, 112))[0]; // 2 Bytes for payload length
      // let reserved =helper[111]; // 1 Byte reserved
      let payload;
      if(Number(type) == MessageTypes.AuthKeyResponse)
      payload = pd;
      else if (Number(type) == MessageTypes.MessageDeleivered||Number(type) == MessageTypes.MessageReceived || Number(type) == MessageTypes.MessageRead  ){
        payload = pd;
        // console.log("message state : " + type);
        // console.log("payload : " + payload.toString("hex") + "as number : " + Uint32Array.from(payload).toString());

      }
     
      else if(Number(type) == MessageTypes.UserConnected || Number(type) == MessageTypes.UserDisconnected){
        payload = pd.subarray(-payloadLength);
      }
      else  // payload of 0-65535 bytes length
      {
        let user = store.getState().users.users.find((u)=> u.user_id == sender.toString("hex"));
        if(!user)
        console.log("dm : user not found !");
        let u = new User(user);
        // console.log("pd length : " + pd.length);
        let piv = BuftoWA(pd.subarray(0,16));
        let cp = CryptoJS.lib.CipherParams.create({ciphertext:BuftoWA(pd.subarray(16,pd.length-32))});
        console.log("dm : payload ciphertext : \n" + cp.ciphertext.toString(CryptoJS.enc.Hex) + "length : " + cp.ciphertext.words.length*4);
        let key = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(await u.key));
        console.log("decrypting for "+ user.user_id + " with key : " + key.toString(CryptoJS.enc.Hex) + "and iv : " + iv.toString(CryptoJS.enc.Hex))
        let dec = CryptoJS.AES.decrypt(cp,key,{
          mode:CryptoJS.mode.CBC,
          iv:piv,
          padding:CryptoJS.pad.NoPadding
        });
        let pbuf = WAtoBuf(dec);
        let sig = BuftoWA(pd.subarray(pd.length-32,pd.length));
        console.log("dm : got payload : " + pbuf.toString("hex"));
        console.log("dm : sig : " + sig.toString(CryptoJS.enc.Hex) + "\nlength : " + sig.words.length*4);
        payload = pbuf;
      }
      console.log('dm : payload length : ' +  payloadLength + 'real length : ' +payload.length);    
      
      msgObj.authKey = auth;
      msgObj.id = id;
      msgObj.recieverId = receiver;
      msgObj.senderId = sender;
      msgObj.timestamp = timeStamp; 
      msgObj.type = type;
      msgObj.payload = payload;
      return msgObj;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
  else{
    try {
      let helper = data;
      let ver = helper[0];
      let id = helper.slice(1, 5); // 32 Bytes for authKey
      let auth = helper.slice(5, 37); // 4 Bytes for id
      let sender = helper.slice(37, 69); // 32 Bytes for sender id
      let receiver = helper.slice(69, 101); // 32 Bytes for receiver
      let timeStamp =toBigIntBE(helper.slice(101, 109)); // 8 Bytes for timestamp
      console.log('dm : timestamp : ' + timeStamp);
      // let chunk = new Uint8Array(new Uint32Array(helper.slice(14, 15)).buffer);
      // let type = chunk.slice(56, 57)[0]; // 1 Byte for type
      let type = data[109];
      console.log('dm : type : '+ type);
      let payloadLength = new Uint16Array(helper.slice(110, 112))[0]; // 2 Bytes for payload length
      // let reserved =helper[111]; // 1 Byte reserved
      let payload = helper.slice(112);
      
      console.log('dm : payload length : ' +  payloadLength + 'real length : ' +payload.length);    
      
      msgObj.authKey = auth;
      msgObj.id = id;
      msgObj.recieverId = receiver;
      msgObj.senderId = sender;
      msgObj.timestamp = timeStamp; 
      msgObj.type = type;
      msgObj.payload = payload;
      return msgObj;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
 
}
const pow = (base, expo) => base**expo;
let requestEncKey = (socket) => {
  let msgRes = new Message();
  let g = 3n;
  let res = pow(g, a) % p;

  msgRes.authKey = new Uint32Array(8);
  msgRes.senderId = Buffer.from(Cookies.get("capp_id"),"hex");
  msgRes.type = new Uint8Array([MessageTypes.EncKeyRequest]);
  msgRes.recieverId = new Uint32Array(8);
  msgRes.id = new Uint32Array([0]);
  msgRes.timestamp = toBufferBE(BigInt(new Date().getTime()),8); // number of seconds since epoch
  msgRes.payload = toBufferBE(res,33);
  console.log("gamodp : " + res.toString(16));
  // console.log("big int took " + msgRes.payload.length)
  // console.log('res client for enc : ' + res)
  let buf = Buffer.concat([
    new Uint8Array([1]),
    new Uint8Array(msgRes.id.buffer),
    new Uint8Array(msgRes.authKey.buffer),
    new Uint8Array(msgRes.senderId.buffer),
    new Uint8Array(msgRes.recieverId.buffer),
    msgRes.timestamp,
    new Uint8Array(msgRes.type.buffer),
    new Uint8Array(new Uint16Array([33]).buffer),
    new Uint8Array([0]),
    msgRes.payload,
  ]);
  socket.send(
    buf
    // structureMessage(
    //   msgRes.id,
    //   msgRes.authKey,
    //   msgRes.senderId,
    //   msgRes.recieverId,
    //   msgRes.timestamp,
    //   msgRes.type,
    //   msgRes.payload
    // )

    // Buffer.from([0x62,0x75,0x66,0x66])
  );
};

let handleHandshake = async(socket,data) => {
  let buf = Buffer.from(data);
  let bk = buf.slice(112); // header size
  let k = toBigIntBE(bk);
  // console.log("buf dump : " + buf.toString("hex") + "\nlength : " + buf.length);
  console.log("gbmodp" + k.toString(16));
  // let msg = destructureMessage(buf);
  // console.log('msgType is : ' + msg.type  + 'id is : ' + msg.id);
  let key = pow(k,a) % p;
  console.log("EncKeyRequest got key " + key.toString(16));
  setEncKey(key.toString(16));
  requestAuthKey(socket);

};
let requestAuthKey = () => {
let msgRes = new Message();
  msgRes.senderId = Buffer.from(Cookies.get('capp_id'),'hex');
  // console.log('request auth key with token (sender id) :  ' + msgRes.senderId.toString('hex'));
  msgRes.id = new Uint32Array([0]);
  let buf = Buffer.concat([
    new Uint8Array([1]),
    new Uint8Array(msgRes.id.buffer),
    new Uint8Array(32),
    msgRes.senderId,
    new Uint8Array(32),
    toBufferBE(BigInt(Date.now()),8),
    new Uint8Array([MessageTypes.AuthKeyRequest]),
    new Uint8Array(new Uint16Array([32]).buffer),
    // new Uint8Array([0]),
  ]);
  encryptAndSendMessage(buf);
};

let handleAuthKey = (data) => {
  if(data.payload.at(109) != MessageTypes.AuthKeyResponse){
    console.log("Warning : message type is NOT AuthKeyResponse ! ");
  }
  console.log("enc key : " + getEncKey());
  // console.log("got auth key : " + data.subarray(-32).toString('hex'));
  console.log("")
  // setAuthKey(data.subarray(-32).toString('hex'));
  console.log("got auth key : " + data.payload.toString("hex"));
  setAuthKey(data.payload.toString("hex"));
  store.dispatch(setConnectionState(true));
  return;
};
let decryptMessage = async(d)=>
{
    let data = Buffer.from(d);
    let decKey = getEncKey();
    if(decKey == '')
    {
        let msg = await destructureMessage(data);
        return msg;
    }
    // console.log("decryptMessage : encrypted buf : \n" + data.subarray(18).toString("hex"));

    // console.log('dec key ' + decKey)
    // let irl = new Uint16Array(data.subarray(0,4));
    // let i = irl[0];
    // let rl = irl[1];
    // console.log('i : ' + i + ' l : ' + rl);
    // console.log("Buf to decrypt \n : " + data.toString("hex"));
    let l= new Uint16Array(data.subarray(0,2))[0];
    let key = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(decKey));
    let iv =BuftoWA(data.subarray(2,18));
    let wa = BuftoWA(data.subarray(18,130));
    let cp = CryptoJS.lib.CipherParams.create({ciphertext:wa});
    // console.log("ciphertext : \n" + wa.toString(CryptoJS.enc.Hex));


    console.log("key : " + key.toString(CryptoJS.enc.Hex) + " iv : " + iv.toString(CryptoJS.enc.Hex));
    let dec = CryptoJS.AES.decrypt(cp,key,{
      iv:iv,
      padding:CryptoJS.pad.NoPadding,
      mode:CryptoJS.mode.CBC
    });
    // console.log("plaintext : \n" + dec.toString(CryptoJS.enc.Hex));
    let buf = Buffer.from(dec.toString(CryptoJS.enc.Hex),'hex');
    if(buf.at(109) == MessageTypes.AuthKeyResponse)
    console.log("decryptMessage : buf : \n" + buf.toString("hex"));
    return await destructureMessage(buf,iv,data.subarray(130));
   
}
const WA222Buf = (wa)=>{
  return Buffer.from(wa.toString(CryptoJS.enc.Hex),'hex');
}
const WAtoBuf = (wa) =>
{
let helper = new Uint32Array(wa.words);
return Buffer.from(helper.buffer);
}
const BuftoWA = (buf)=>
{
    let nbuf;
    if(buf.length % 16 == 0)
    nbuf =  buf;
    else
 nbuf = Buffer.concat([buf,Buffer.from(new Uint8Array(16-buf.length%16).buffer)]);
//  console.log('nbuf length : ' + nbuf.length);
let ar = new Array(nbuf.length/4);
let nbufstring = nbuf.toString("hex");


for(let i = 0;i<nbufstring.length;i=i+8)
{
    let b = nbufstring.slice(i,i+8);
  ar[i/8] = new Uint32Array(new Uint8Array(Buffer.from(b,"hex")).buffer)[0];
}
// console.log('ar length : ' +  ar.length);
return CryptoJS.lib.WordArray.create(ar);
}
const encryptAndSendMessage = (buf)=>
{
  let l = buf.length;
  // console.log("before encryption " + buf.toString("hex")+ " length : " + buf.length);
  let wa = BuftoWA(buf);
  // console.log("before encryption wa : " + wa.toString(CryptoJS.enc.Hex))
  // let i = Math.floor((Math.random()*10)%8) // choose a random iv from the list of ivs
  let iv = CryptoJS.lib.WordArray.random(16);
  let key = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(getEncKey()));
  // console.log('encrypting with key : ' + key.toString(CryptoJS.enc.Hex) + " : " + getEncKey()  + "and iv  " + iv.toString(CryptoJS.enc.Hex));
  let ct = CryptoJS.AES.encrypt(wa,key,{
    iv:iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding,
  
  });
  // let ct = CryptoJS.AES.encrypt(buf.toString("base64"),getEncKey());
  // let pt = CryptoJS.AES.decrypt(ct,key,{
  //   iv:iv,
  //   mode:CryptoJS.mode.CBC,
  //   padding:CryptoJS.pad.NoPadding,
  // })
  // console.log("decrypted : " + pt.words + "and length : " + pt.words.length*4);
  let ivbuf = WAtoBuf(iv);
  let res = Buffer.concat([new Uint8Array(new Uint16Array([l]).buffer),ivbuf,WAtoBuf(ct.ciphertext)]);
  // let res = Buffer.concat([Buffer.from(new Uint16Array([i]).buffer),Buffer.from(new Uint16Array([l]).buffer),new Uint8Array(32)]);
  // console.log("encrypted : " + ct.ciphertext.toString(CryptoJS.enc.Hex)+ " and length : " + ct.ciphertext.words.length*4);
  // console.log("decrypted : " + pt.toString(CryptoJS.enc.Hex) + "and length : " + pt.words.length*4);
  // console.log("sent buffer length : " + res.byteLength + "iv buf length : " + ivbuf.byteLength);
  // let res = WAtoBuf(ct.ciphertext.words)
  if(globalSocket)
 { 
  globalSocket.send(res);
  if(buf.at(109) == MessageTypes.AuthKeyRequest)
  console.log("AuthKeyRequest buf : \n" + res.toString("hex") + "\nlength : " + res.length + "\niv : " + ivbuf.toString("hex") + "encrypted with key " + key.toString(CryptoJS.enc.Hex));


}
  else
  throw('Error Socket is not initialized ! ');
}

function NotifyMessageRead(id)
{
  // let buf = structureMessage(1,'08c5a54e766e56a6f8430524d46fb0fee37b775701c44995daaf36640e33d265',Cookies.get('capp_id'),id,MessageTypes.MessageRead,new Uint8Array(1).buffer)
  let buf = Buffer.concat([
    new Uint8Array([1]),
    new Uint8Array(new Uint32Array([0]).buffer),
    new Uint8Array(32),
    Buffer.from(),
    new Uint8Array(32),
    toBufferBE(BigInt(Date.now()),8),
    new Uint8Array([MessageTypes.MessageRead]),
    new Uint8Array(new Uint16Array([32]).buffer),
    // new Uint8Array([0]),
  ]);
  encryptAndSendMessage(buf);

}
let handleMessage = async(data, socket) => {
  let ev = new Event("message_recieved");
  window.addEventListener("message_received", (e) => {});
  let msgObj = await decryptMessage(data);
  //   if (!getEncKey()) {
  //     handleHandshake(data, socket);
  //     return;
  //   }
  if (!getAuthKey()) {
    handleAuthKey(msgObj);
    return;

  }
  // console.log('message received handling it ...');
  addToMessageQueue_Incoming(msgObj);
  // let msgObj = destructureMessage(msg);
  let msgid = msgObj.id;
  let p = Buffer.from(Uint8Array.from(msgObj.payload).filter((v)=>v!=0)).toString("utf8");
  
  switch (msgObj.type) {
    case MessageTypes.UserTyping:
      window.dispatchEvent(new Event('user_typing'))
      break;
    case MessageTypes.Text:
      await globalDb.messages.add({type:MessageTypes.Text,timestamp:Date.now(),payload:p,state:'deleivered',senderId:msgObj.senderId.toString('hex'),direction:'in'});
      store.dispatch(setUserLastMessage({id:msgObj.senderId.toString('hex'),message:p}));
      store.dispatch(pushMessage({type:MessageTypes.Text,timestamp:Date.now(),payload:p,senderId:msgObj.senderId.toString("hex"),direction:'in',state:'deleivered'}));
      break;
    case MessageTypes.MessageDeleivered:
      
      console.log("message deleivered  : sender : " + msgObj.payload.toString("hex") + " id : " + msgid);
      await globalDb.messages.where("senderId").equals(msgObj.payload.toString("hex")).and((v)=> v.id == msgid).modify({state:'deleivered'});
      break;
    case MessageTypes.MessageRead:
      console.log("message read  : sender : " + msgObj.payload.toString("hex") + " id : " +msgid);
      store.dispatch(setMessageState({id:msgid,state:'seen'}));
      await globalDb.messages.where("senderId").equals(msgObj.payload.toString("hex")).and((v)=> v.id == msgid).modify({state:'seen'});
      break;
     case MessageTypes.UserConnected:
      console.log("user connected  : " + msgObj.payload.toString("hex"));
      store.dispatch(setUserState({id:msgObj.payload.toString("hex"),state:"c"}));
      break;
     case MessageTypes.UserDisconnected:
      console.log("user disconnected  : " + msgObj.payload.toString("hex"));
      store.dispatch(setUserState({id:msgObj.payload.toString("hex"),state:"n"}));
     break;
     case MessageTypes.MessageReceived:
      console.log("message received  : sender : " + msgObj.payload.toString("hex") + " id : " + msgid);
      await globalDb.messages.where("senderId").equals(msgObj.payload.toString("hex")).and((v)=> v.id == msgid).modify({state:'deleivered'});
     break;
    
  }
 

};
function getMonthString(monthIndex) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

 
  let monthString = months[monthIndex];
  return monthString;
}
function getTimeStringWithYesterday(date) {
  let currentDate = new Date(); // Current date
  let yesterdayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1); // Yesterday's date
  
  let hours = date.getHours();
  let minutes = date.getMinutes();

  let hoursString = hours < 10 ? "0" + hours : hours.toString();
  let minutesString = minutes < 10 ? "0" + minutes : minutes.toString();

  let timeString = hoursString + ":" + minutesString;

  if (date.toDateString() === yesterdayDate.toDateString()) {
    timeString = "Yesterday " + timeString;
  }

  return timeString;
}
function getDayString(dayIndex) {
  const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];


  let dayString = days[dayIndex];

  return dayString;
}

function handleError(){

}
const initiateStuff =  async() =>
{
  console.log("initiating ...");
  if(!Cookies.get('capp_token')){
   window.location.replace('/login')
  }
  let err = null ;
  usersDb = new Dexie('localdata/users');
  usersDb.version(1).stores({
    users:'++id,user_id'
  });
  globalDb =   new Dexie('localdata/' + Cookies.get('capp_id'));
  globalDb.version(1).stores({
   messages: "++id,senderId,direction,type,timestamp,state"
 });
  keyStore = new Dexie('localdata/keystore');
    keyStore.version(1).stores({
      keys : 'id++'
    }) 
    let msgstosend = [];
    let pmessages = await globalDb.messages.where('state').equals('unsent').toArray();
    if(pmessages.length != 0){
     pmessages.forEach(async(msg) =>{
       if(msg.type == MessageTypes.Text){
         let user = new User(msg.id);
         let encpayload = user.encryptMessage(msg.payload);
         msgstosend.push({...msg,payload:encpayload});
       }
       else if(msg.type == MessageTypes.Voice || msg.type == MessageTypes.Image){
        let p = msg.payload;
        let formdata = new FormData();
        formdata.append('file',p);
        let response = await fetch('http://localhost:8080/upload',{
          headers:{
            'ClientId':Cookies.get('capp_id'),
            'Authorization':'Basic ' + Cookies.get('capp_token'),
          },
          body:formdata,
        }).then(res => res.json());
        msgstosend.push({...msg,payload:response.url});      
       }
       
     })
    }
  if(initiated === 0 && Cookies.get('capp_id'))
  {
    if(globalDb){
      globalDb.messages.hook('updating',(mods,primkey,obj,trans)=>{
        setMessageState({id:obj.id,state:mods["state"]})
      })
      globalDb.messages.hook('creating',(primKey,obj,trans)=>{
        let pobj = {};
        let arr = [];
        for (let i =0 ;i<obj.payload.length;i++){
          arr[i] = obj.payload.at(i);

        }
        pobj.senderId = obj.senderId;
        pobj.type = obj.type;
        pobj.timestamp = obj.timestamp;
        pobj.payload =arr;
        console.log('some object has been added to db with id : ' + primKey);
        pobj.id = obj.id;
        pobj.state = obj.state;
        pobj.direction = obj.direction;
        // store.dispatch(pushMessage(pobj));
      });
      // globalDb.messages.hook('updating',(primKey,obj,trans)=>{

      // })
    }
    let r = Math.floor(Math.random()*100000);
    fetch('http://localhost:8080/chat',{
  method:'POST',
  headers:
  {
     'Authorization':'Basic ' + Cookies.get('capp_token'),
     'ClientId':Cookies.get('capp_id'),
     'TMPID':r.toString(10),
     
  },
  body:msgstosend,
 })
 
 .then((res) => res.json())
 .then(async(data)=>
 {
  if(!globalSocket){
    const socket = new WebSocket('ws://localhost:8080/ws' + '?id='+r.toString(10));
    initiated++;
    console.log(data);
    
    socket.binaryType='arraybuffer';
    socket.onmessage = async(ev)=>
    {
      console.log("socket got message ")
      if(ev.data instanceof ArrayBuffer)
      {
        let binaryData = new Uint8Array(ev.data);
        if (getEncKey() == '') {
          handleHandshake(socket,binaryData);
          return;
        }
        handleMessage(binaryData, socket);
        return
      }
    }
    socket.onopen = (ev) =>
    {
      console.log("Socket opened requesting enc key");
      requestEncKey(socket);
  
    }
    socket.onerror = (ev)=>{
      console.log('WebSocket error : ' + ev.toString());
      window.dispatchEvent(new Event('error_occured'))
    }
    socket.onclose = (ev) => {
      store.dispatch(setConnectionState(false))
      if(ev.wasClean){
        console.log('socket closed cleanly')
      }
      console.log('socket closed abruptly' + ev.reason);
      // handle abrupt closing
    }
    store.dispatch(setReady())
    globalSocket = socket;
  }
  else{
    console.log("socket already initialized ")
  }
 
   
  


   
    // new Dexie('localdata/' + Cookies.get('capp_id'))
    // .open()
    // .then((db)=>
    // {
    //   console.log("DB already exists")
    //   globalDb = db;

    // })
    // .catch('NoSuchDatabaseError',function(e){
    //   console.log("DB does not exist creating it");

    //  let db =   new Dexie('localdata/' + Cookies.get('capp_id'));
    //  db.version(1).stores({
    //   messages: "++id,senderId,direction,type,timestamp"
    // });
    
    //   globalDb = db;
    // })
    // .catch((e)=>
    // {
    //   console.log('Fatal Error openeing database : ' + e.toString())
    // })
    
  
   
 })
 .catch((e)=>
 {
 err = e;
 })
 .finally(()=>
 {
  window.dispatchEvent(new CustomEvent('fetch_completed',{detail:err ? {success:true,error:null} :{sucess:false,error:err}}))
 })
  }
  fetch("http://localhost:8080/sync",{
    method:"GET",
    headers: {
      "UserID":Cookies.get("capp_id"),
      "Authorization":Cookies.get("capp_token"),
    }

  })
  .then((response)=> response.json())
  .then((data)=>{
   for(let i = 0;i<data.length;i++){
    let user = new User(data[i])
   }
  })
  .catch((e)=>{
    console.log("sync request failed : " + e.toString());
  })

}
// window.onload = () =>
// {
//   if(globalSocket == null)
//   initiateStuff();
// }
window.addEventListener('unload',()=>
{
  console.log('closing socket ...');
  globalSocket.close();
})
// socket.on("close", () => {});
function structureMessage(
  id,
  authKey,
  senderId,
  recieverId,
  type,
  payload
) {
  //TODO: reduce the number of parameters of structure message
    let res,dataBuf;
    switch(type)
    {
        case MessageTypes.Text:
            //  console.log('authkey' + authKey + ' senderId ' + senderId + ' receiverId ' + recieverId);
             dataBuf = Buffer.concat([
                           
                toBufferBE(BigInt(new Date().getTime()),8),
                new Uint8Array([type]),
                new Uint8Array(new Uint16Array([payload.byteLength]).buffer),
                new Uint8Array(1),
                new Uint8Array(payload)
              ]);
              res = dataBuf;
            break;
        case MessageTypes.AuthKeyRequest:
          dataBuf = Buffer.concat([           
            new Uint8Array(new Uint32Array([id]).buffer),
            new Uint8Array(Buffer.from(authKey,'hex')),
            new Uint8Array(Buffer.from(senderId,'hex')),
            new Uint8Array(Buffer.from(recieverId,'hex')),
            toBufferBE(BigInt(new Date().getTime()),8),
            new Uint8Array([type]),
            new Uint8Array(new Uint16Array([payload.byteLength]).buffer),
            new Uint8Array(1),
            new Uint8Array(payload)
          ]);
          res = dataBuf;
          break; 
          case MessageTypes.MessageRead:
          
            dataBuf = Buffer.concat([           
              new Uint8Array(new Uint32Array([id]).buffer),
              new Uint8Array(Buffer.from(authKey,'hex')),
              new Uint8Array(Buffer.from(senderId,'hex')),
              new Uint8Array(Buffer.from(recieverId,'hex')),
              toBufferBE(BigInt(new Date().getTime()),8),
              new Uint8Array([type]),
              new Uint8Array(new Uint16Array([payload.byteLength]).buffer),
              new Uint8Array(1),
              new Uint8Array(payload)
            ]);
            res = dataBuf;
          break;
          case MessageTypes.UserTyping:
            dataBuf = Buffer.concat([           
              new Uint8Array(new Uint32Array([id]).buffer),
              new Uint8Array(Buffer.from(authKey,'hex')),
              new Uint8Array(Buffer.from(senderId,'hex')),
              new Uint8Array(Buffer.from(recieverId,'hex')),
              toBufferBE(BigInt(new Date().getTime()),8),
              new Uint8Array([type]),
              new Uint8Array(new Uint16Array([payload.byteLength]).buffer),
              new Uint8Array(1),
              new Uint8Array(payload)
            ]);
            res = dataBuf;
          break;  
          default :
          
          break;   
    }
  return res;
}
export {
  structureMessage,
  destructureMessage,
  Message,
  MessageTypes,
  getAuthKey,
  getEncKey,
  setEncKey,
  setAuthKey,
  getFromMessageQueue_Incoming,
  addToMessageQueue_Incoming,
  a,p,getActiveChat,setActiveChat,
  getInterm,
  setInterm,
  ivs,
  errors,
  setToken,
  getToken,
  encryptAndSendMessage,
  globalDb,
  NotifyMessageRead,
  keyStore,
  User,
  usersDb,
  getDayString,
  getMonthString,
  getTimeStringWithYesterday,
  initiateStuff,
};
