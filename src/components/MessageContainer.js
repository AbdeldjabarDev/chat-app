import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageTypes, getTimeStringWithYesterday,User } from '../scripts/utils';
import { useSelector } from 'react-redux';
import { useInView } from 'react-intersection-observer';
import store from '../state/store';
import { setMessageState } from '../state/slices/userSlice';
// const iconv = require('iconv-lite')
export default function MessageContainer(props) {
  // const mprops = useMemo(()=> props,[props]);
  let torender = <></>;
  let m = useSelector((state)=> state.users.currentMessages[props.index]);
  let mem_m = useMemo(()=> m,[m]);
  let doo =  new Date(mem_m.timestamp);
  let [v,setV] = useState(false);
  let {ref,inView,entry} = useInView();

  useEffect(()=>{
    if (inView) {
      // console.log('inview : id : '  + mem_m.id)
      if(mem_m.state != 'seen'){
        let user = new User(store.getState().users.current);
        //user.NotifyMessageRead(mem_m.id);
        store.dispatch(setMessageState({id:mem_m.id,state:"seen"}));
        // mem_m.state = "seen";
      }
    }
  })
  switch(mem_m.type){
    case MessageTypes.Text:
      // console.log("mc : text");
     torender =  <div
      className="flex flex-col rounded-md px-[10px] pt-[5px] relative min-h-[50px] h-fit"
      ref={ref}
     onMouseEnter={(e)=>{setV(true)}}
     onMouseLeave={(e)=>{setV(false)}}
      style={{
        backgroundColor: mem_m.direction == "in" ? "white" : "#d7fad1",
        marginLeft: mem_m.direction == "in" ? "10px" : "auto",
        marginRight: mem_m.direction == "in" ? "auto" : "10px",
        clipPath:
          mem_m.direction == "in"
            ? "polygon(0% 0%,6px 4px,100% 3px,100% 100%,0% 100%)"
            : "polygon(0% 4px,96% 4px,100% 0%,100% 100%,0% 100%)",
            
      }}
    >
      <div>{
      mem_m.payload}</div>
      <div style={{ display: "flex",gap:'5px' }}>
      <div
            style={{
              marginBottom: "2px",
              marginRight: "4px",
              fontSize: "10px",
              marginLeft: "auto",
              marginTop: "auto",
            }}
          >
            {getTimeStringWithYesterday(doo)}
          </div>
        <div className='flex relative ml-2 mr-auto'>
         <div style={{display:v ? 'flex':'none'}} onClick={(e)=>{
          navigator.clipboard.writeText(Buffer.from(mem_m.payload.filter((v)=> v!=0)).toString("utf8"))
          
         }}>copy</div>
          {mem_m.direction == "out" ? (
            mem_m.state ? (
              <img
                style={{ width: "10px", height: "10px" }}
                src={"../" + mem_m.state + ".svg"}
              ></img>
            ) : (
              ""
            )
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
      break;
     case MessageTypes.Image:
      torender =  <div
      className="flex flex-col px-[10px] pt-[5px] relative min-h-[50px] h-fit shadow-md shadow-blue-300"
      ref={ref}
      style={{
        backgroundColor: mem_m.direction == "in" ? "white" : "#d7fad1",
        marginLeft: mem_m.direction == "in" ? "10px" : "auto",
        marginRight: mem_m.direction == "in" ? "auto" : "10px",
        clipPath:
          mem_m.direction == "in"
            ? "polygon(0% 0%,6px 4px,100% 3px,100% 100%,0% 100%)"
            : "polygon(0% 4px,96% 4px,100% 0%,100% 100%,0% 100%)",
            
      }}
    >
      <img src={
      mem_m.payload}></img>
      <div style={{ display: "flex",gap:'5px' }}>
      <div
            style={{
              marginBottom: "2px",
              marginRight: "4px",
              fontSize: "10px",
              marginLeft: "auto",
              marginTop: "auto",
            }}
          >
            {getTimeStringWithYesterday(doo)}
          </div>
        <div>
         
          {mem_m.direction == "out" ? (
            mem_m.state ? (
              <img
               className='w-[10px] h-[10px] mr-2 ml-auto'
                src={"../" + mem_m.state + ".svg"}
              ></img>
            ) : (
              ""
            )
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
      break;
      case MessageTypes.File:

        break; 
  }
  return (
   <>{torender}
   </>
  );
}
