import { useRef } from "react";
import { useState } from "react";
import CryptoJS from "crypto-js";
import { errors, keyStore, setToken, setUserId } from "../scripts/utils";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Button, Input, TextField } from "@mui/material";
import { ec } from "elliptic";
// import { ErrorSharp } from "@mui/icons-material";
export default function Login(props) {
  let [login, setLogin] = useState(true);
  let passRef = useRef();
  let emRef = useRef();
  let pfRef = useRef();
  let cpassRef = useRef();

  let unRef = useRef();
  let [data, setData] = useState("");
  let [error, setError] = useState("");
  let nav = useNavigate();
  let fr = new FileReader();
  return (
    <div
    className="w-full min-h-screen flex flex-col bg-[#eef1f4] "
    >
      <div
        className="mx-auto my-auto w-[40%] h-[80%] "
      >
        <form
          className="bg-white flex flex-col gap-6 shadow-lg shadow-[#e6ebf2]"
          style={{
            height:login == true ? '80%':'fit-content'
          }}
          onSubmit={(e) => {
            setError("");
            console.log("email : " + emRef.current.value);
            console.log(
              "password : " +
                CryptoJS.SHA256(passRef.current.value).toString(
                  CryptoJS.enc.Hex
                )
            );
            e.preventDefault();
            if (login) {
              let formData = new FormData();
              formData.append('email',emRef.current.value);
              formData.append('password',CryptoJS.SHA256(
                passRef.current.value
              ).toString(CryptoJS.enc.Hex));
              fetch("http://localhost:8080/" + "login", {
                method: "POST",
                body: formData,
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.error == errors.INCORRECT_PASSWORD) {
                    setError("Incorrect email or password");
                  }
                  if (data.error == errors.INTERNAL_ERROR) {
                    setError("Intenal error try again later ");
                  }
                  if (data.error == errors.NO_ACCOUNT) {
                    setError("There is no account associated with this email");
                  }
                  if (data.error == errors.CHAT_APP_OK) {
                    console.log("logged in successfully got id : " + data.id);
                    Cookies.set("capp_token", data.token);
                    Cookies.set("capp_id", data.id);
                    
                    nav("/chat", { replace: true });
                  }
                })
                .catch((e) => {
                  console.log(e);
                  setError(e.toString());
                });
            } else {
              let eec = new ec('p256');
              let user = eec.genKeyPair();
              
              let pubKey = user.getPublic("hex");
              keyStore.keys.clear();
              keyStore.keys.add({public: pubKey,private : user.getPrivate("hex")});
              
              let str;
              let file = pfRef.current.files[0];
              
              if (file == undefined) {
                setError("You haven't picked a profile photo");
              }
              let formData = new FormData();
              formData.append("email",emRef.current.value);
              formData.append("user_name",unRef.current.value);
              formData.append("password",passRef.current.value);
              formData.append("public",pubKey);
              formData.append("image",file);
             
              let fr = new FileReader();
              fr.onloadend = (t, ev) => {
                
                str = Buffer.from(fr.result).toString("base64");
                console.log(fr.result.byteLength);
                setData(URL.createObjectURL(file));
                fetch("http://localhost:8080/" + "signup", {
                  method: "POST",
                  headers: {
                   
                  },
                  // body: JSON.stringify({
                  //   email: emRef.current.value,
                  //   password: passRef.current.value,
                  //   profile_photo: str,
                  //   user_name: unRef.current.value,
                  //   public : pubKey,
                  // }),
                  body:formData,
                })
                  .then((r) => r.json())
                  .then((data) => {
                    if (data.error == errors.EMAIL_USED) {
                      setError("Email already used");
                    }
                    if (data.error == errors.INTERNAL_ERROR && !data.message) {
                      setError("Internal error try again later");
                    }
                    if (data.error == errors.INTERNAL_ERROR && data.message) {
                      setError(data.message);
                    }

                    if (data.error == errors.CHAT_APP_OK){
                      Cookies.set('capp_id',data.id);
                      Cookies.set('capp_token',data.token);
                      
                    }
                  })
                  .catch((e) => {
                    console.log(e);
                    setError(e.toString());
                  });
              };
              fr.readAsArrayBuffer(file);
            }
          }}
        >
          <div
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              fontSize: "26px",
              width: "fit-content",
              marginTop: "6%",
            }}
          >
            {login ? "Login" : "Sign Up"}
          </div>
          <TextField
            variant="outlined"
            disableUnderline
            inputRef={emRef}
            sx={{ marginLeft: "auto", marginRight: "auto" }}
            type="email"
            label="Email"
            className="login-input"
          ></TextField>
          <TextField
            variant="outlined"
            disableUnderline
            inputRef={passRef}
            sx={{ marginLeft: "auto", marginRight: "auto" }}
            type="password"
            label="Password"
            className="login-input"
          ></TextField>
          <TextField
            variant="outlined"
            disableUnderline
            inputRef={cpassRef}
            sx={{marginLeft: "auto", marginRight: "auto",display:login == true ? 'none':'inline-flex',}}
            type="password"
            label="Confirm Password"
            className="login-input"
            
          ></TextField>
          <TextField
            variant="outlined"
            disableUnderline
            inputRef={unRef}
            sx={{ marginLeft: "auto", marginRight: "auto",display:(login == true ? 'none':'inline-flex')}}
            type={"text"}
           
            className="login-input"
         
            label="User name"
          ></TextField>
          <label
            htmlFor="profile"
            className="hover:bg-[#1976d2] hover:text-white shadow-sm shadow-[#68b3ff] border border-[#1976d2] px-3 py-3 rounded-lg fit-content mx-auto text-lg"
            style={{ display: login == true ? "none" : "inline" }}
          >
            {data == "" ? "Choose a profile photo" : "Choose another"}
            <br></br>
            <Input
              type={"file"}
              id="profile"
              accept=".jpeg,.png,.svg"
              inputRef={pfRef}
              style={{ display: "none" }}
              onChange={(e) => {
                let file = pfRef.current.files[0];
                setData(URL.createObjectURL(file));
              }}
            ></Input>
          </label>
          <div style={{ display: data == "" ? "none" : "flex" }}>
            <div>
              <div style={{ marginLeft: "40px" }}>
                {" "}
                Preview :
                <div>
                  <img
                    src={data}
                    style={{ width: "100px", height: "100px" }}
                  ></img>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{ width: "fit-content", marginLeft: "auto", marginRight: "auto",marginTop:"20px"}}
          >
            <Button
              type="submit"
              variant="contained"
              sx={{
                paddingLeft: "20px",
                paddingRight: "20px",
                paddingBottom: "5px",
                paddingTop: "5px",
                marginLeft: "auto", 
                marginRight: "auto" ,
                width:"150px",
                height:"50px"

              }}
            >
              {login ? "Login" : "Sign Up"}{" "}
            </Button>
          </div>
          <div
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              width: "fit-content",
            }}
          >
            {login ? "No Account ?" : "Already have an account ?"}{" "}
            <span
              className="login-span"
              onClick={(e) => {
                setLogin(!login);
                setData("");
              }}
            >
              {login ? "Sign Up" : "Login"}
            </span>
          </div>
          <div
            style={{
              color: "rgb(220,20,20)",
              marginRight: "auto",
              marginLeft: "auto",
            }}
          >
            {error}
          </div>
        </form>
      </div>
    </div>
  );
}
