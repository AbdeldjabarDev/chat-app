// import { MessageSharp } from "@mui/icons-material";
import { useEffect, useState,useMemo, useRef } from "react";
import { getActiveChat, getMonthString, globalDb, MessageTypes } from "../scripts/utils";
import { NotifyMessageRead,User } from "../scripts/utils";
import MessageContainer from "./MessageContainer"
import { useSelector } from "react-redux";
// import { render } from "@testing-library/react";
import imgOne from '../assets/send_bt_bg.svg'
import {Input} from "@mui/material";
import { AttachFile, PaddingRounded } from '@mui/icons-material';
import SendFileComp from "./SendFileComp";
let intitiated = 0;
let message_cache = [];
export default function ChatMessageContainer(props)
{
    // get Messages from db depending on uid and display them 
    let muser = useSelector((state)=> state.users.current);
    let user = useMemo(()=> muser,[muser]);
  let [fname,setFname] = useState(null);

    let miRef = useRef();
    // let [message_conts,setMessageConts] = useState([]);
    
    let pmessage_conts = useSelector((state)=> state.users.currentMessages)
    let message_conts = useMemo(()=> pmessage_conts,[pmessage_conts]);
    useEffect(()=>
    {

        if(intitiated == 0)
        {
            
            // getMessagesAndInstallHook(message_conts,setMessageConts);
        
            // window.addEventListener('chathead_clicked',async()=>
            // {
            // setMessageConts(new Array(0));
            // let messages =await globalDb.messages.where("senderId").equals(user.user_id).toArray();   
            // setMessageConts(messages);       
            // // messages.forEach((v)=>   
            // // { 
            // //         switch(v.type)
            // //         {
            // //            case MessageTypes.Text:
            // //               message_conts.push(v)
            // //             break;
            // //         }
            // //         // console.log(Number(v.timestamp.toString().substr(0,v.timestamp.toString().length)))                  
            // //     })
            // //     setMessageConts(message_conts.slice());
            // console.log('message conts length ' + message_conts.length);
            //     // let col = await globalDb.messages.where('senderId').equals(user.user_id).and((v)=> v.state != 'seen').toArray();
            //     // for(let i = 0;i<col.length;i++){
            //     //     user.NotifyMessageRead(col[i].id)

            //     // }
            // // TODO :  add function to send message seen to user;
            // })

intitiated++;       
       
        }
       
    })
    let torender = [];
let prevDate = null;

message_conts.forEach((v, i) => {
  let currDate = new Date(v.timestamp);
  
  if (prevDate === null || currDate.getDate() !== prevDate.getDate() || currDate.getMonth() !== prevDate.getMonth()) {
    if(currDate?.getDate() ===  new Date(Date.now()).getDate() - 1)
    {
      torender.push(<div className="flex w-full" key={Math.random()*1000000}>
      <div className="flex self-center mx-auto">{"Yesterday"}</div>
    </div>)
    }
    else
    torender.push(
      <div className="flex w-full" key={Math.random()*10000000}>
        <div className="flex self-center mx-auto">{getMonthString(currDate.getMonth()) + " " + currDate.getDate()}</div>
      </div>
    );
  }
  
  torender.push(
    <MessageContainer 
      message={v.payload}
      d={v.direction}
      key={Math.random() * 100000000}
      time={v.timestamp}
      state={v.state}
      type={v.type}
      index = {i}
      
    />
  );

  prevDate = currDate;
});

//     let torender = [];

//     message_conts.forEach((v,i)=>{
//       if(i != 0){
//         let t = new Date(v.timestamp);
//         let oldt = new Date(message_conts[i-1].timestamp);
//         if(t.getMonth() == oldt.getMonth ){
//           if(t.getDay() > oldt.getDay()){
//           torender.push(<div className = "flex w-full">
//           <div className="flex self-center mx-auto">{getMonthString(t.getMonth()) + " " + t.getDate()}</div>
//             </div>)
//           torender.push(
//             <MessageContainer 
//           message={v.payload}
//           d={v.direction}
//           key = {Math.random()*100000000}
//           time={v.timestamp}
//           state={v.state}
//           type = {v.type}
//           >
//           </MessageContainer>
//           )
//           }
//           else{
// torender.push(
//             <MessageContainer 
//           message={v.payload}
//           d={v.direction}
//           key = {Math.random()*100000000}
//           time={v.timestamp}
//           state={v.state}
//           type = {v.type}
//           >
//           </MessageContainer>
//           )
//           }
        
//         } 
//         else{
//           torender.push(<div className = "flex w-full">
//           <div className="flex self-center mx-auto">{getMonthString(t.getMonth()) + " " + t.getDate()}</div>
//             </div>)
//           torender.push(
//             <MessageContainer 
//           message={v.payload}
//           d={v.direction}
//           key = {Math.random()*100000000}
//           time={v.timestamp}
//           state={v.state}
//           type = {v.type}
//           >
//           </MessageContainer>
//           )
//         } 
//       }
    
//     })
    return (<div className="h-full relative overflow-hidden">
    {fname && <SendFileComp vis={fname}></SendFileComp>}  
      <div className="flex flex-col  overflow-y-auto  border border-indigo-600" style={{height:"calc(100% - 40px)"}}>
      {
      torender      
    } 
      </div>         
    <div
     className="flex gap-[10px] absolute bottom-0 left-0 bg-white  h-[40px] w-full mb-0"
      >
        <input
          placeholder="Type your messsage here "
        disabled={user ? false:true}
          ref={miRef}
          type='text'
          style={{
            height: "40px",
            fontSize: "large",
            outline:'none',
            marginRight :"150px",
            marginLeft:'auto',
            paddingLeft: "10px",
            border:'none',
            width:'100%',
             
          }}
        ></input>
       
       <label style={{display: user ? "flex":"none"}}>
        <span className="hover:bg-blue-400 hover:shadow-blue-300 hover:shadow-sm flex my-auto w-10 h-10 rounded-full hover:bg-opacity-50">
        <AttachFile className="my-auto  m-2  " sx={{
          color:" rgb(59 130 246)",
          PaddingRounded:"3px",
        }}></AttachFile>
        </span>
       
         
         <Input
              type="file"
              name="file"
              style={{ display: "none" }}
              disabled = {user ? false:true}
              onChange={(e)=>{
                console.log("selected file " + e.target.files[0].name);
               setFname(e.target.files[0]);
              }}
              
            ></Input>
       </label>
        <img
        src={imgOne}
        // className="bt-send"
        className="w-[40px] h-[40px] bg-no-repeat my-auto hover:shadow-md"
          onClick={(e) => {
            // let p = children.slice();
            
            // console.log('send on click children length : ' + children.length)
          //   children.push(
          // {  msg: miRef.current.value,d:'out',timestamp:BigInt(new Date().getTime())}
          //   ); 
            // let t = Cookies.get('capp_token');
            // console.log('sending text message with token : ' + t + 'and sender id  : ' + Cookies.get('capp_id'));
            
            // let msg_buf = structureMessage(1,'08c5a54e766e56a6f8430524d46fb0fee37b775701c44995daaf36640e33d265',Cookies.get('capp_id'),user.id,MessageTypes.Text,Buffer.from(miRef.current.value,"utf-8"));
            try
            {
              let u = new User(user);
           u.sendMessage(miRef.current.value,MessageTypes.Text);
            // let m = {
            //   senderId:Cookies.get('capp_id'),
            //   direction : 'out',
            //   type: MessageTypes.Text,
            //   timestamp: new Date().getTime(),
            //   state : 'deleivered',
            //   payload: miRef.current.value
            //   };
         
            // globalDb.messages.add(m).catch((e)=>
            //    {
            //     console.log('error from inside add promise : ' + e.toString());
            //    })
            }
            catch(error)
            {
        console.log('failed to add message to db outgoing : ' + error.toString());
            }
             
            // setChildren(children.slice()); // force rerender
            // console.log(...children);
            miRef.current.value = '';
           
          }}
        >
       
        </img>
      </div>
    </div>)
}