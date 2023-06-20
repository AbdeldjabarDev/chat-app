import { createSlice } from "@reduxjs/toolkit";


export const userSlice =  createSlice(
    {
        name:'users',
        initialState :{
            users: [],
            ready:false,
            current:null,
            currentMessages:[],
            socketConnected:false,
        },
        
    reducers:
    {
        addUser : (state,action)=>
        {
           state.users.push(action.payload);
           
        }
        ,
        pushMessage : (state,action)=>{
            if(state.currentMessages[0]?.senderId != action.payload.senderId)
            {
                state.currentMessages = [];
            }
          state.currentMessages.push(action.payload);  
        },
        setUserLastMessage :(state,action) =>
        {
            let i = state.users.findIndex((v) => v.user_id == action.payload.id);
            state.users[i].last = action.payload.message;

        }
        ,
        setUserState : (state,action)=>
        {
            let i = state.users.findIndex((v) => v.user_id == action.payload.id);
            state.users[i].state = action.payload.state;   
        },
        setReady : (state,action) =>
        {
            state.ready = true;
        }
        ,
        setCurrentUser : (state,action)=>{
           state.current = action.payload
        },
        setMessageState : (state,action)=>{
            let obj = {};
            let i = state.currentMessages.findIndex((v)=> v.id == action.payload.id);
            
            if(i!=-1){
                let m = state.currentMessages[i];
                obj = {...m,state:action.payload.state}
                state.currentMessages[i] = obj;
            }
            else{
                console.log("error setting message state : id not valid !");
            }
           
        },
        clearMessages : (state,action)=>{
        state.currentMessages = [];
        },
        setMessages : (state,action)=>{
            state.currentMessages = action.payload;
        },
        setConnectionState : (state,action)=>{
            state.socketConnected = action.payload;
        }

    }
    }
)
export const {addUser,setUserLastMessage,setUserState,setConnectionState,setReady,setCurrentUser,pushMessage,setMessageState,setMessages,clearMessages} = userSlice.actions;
export default userSlice.reducer;