import { useEffect, useRef } from "react";
import { MessageTypes, User, getActiveChat, getAuthKey, structureMessage } from "../scripts/utils";
// import Cookies from "js-cookie";
import pdfjslib from 'pdfjs-dist'
export default function SendFileComp({vis}){
    let modalRef = useRef();
    let canvasRef = useRef();
    let capRef = useRef();
    let name = vis ? vis.name : "";
    let url = vis ? URL.createObjectURL(vis):"";
    useEffect(()=>{
        if(vis)
        {
          let ext = name.substring(name.lastIndexOf(".")+1,name.length);
            if (ext == "jpeg" || ext == "png"  || ext == "jpg"  ){
                let img =new Image();
                console.log("image url : " + url);
                img.src = url;
                img.onload = (e)=>{
                  console.log("drawing image");
                    let context = canvasRef.current.getContext("2d");
                    context.drawImage(img,0,0)
                }
                }
                else if(ext == "pdf"){
                    pdfjslib.getDocument({
                        url: url,
                        range: [1, 1] // Load only the first page
                      }).promise.then(function(pdf) {
                      
                        // Get the first page of the PDF
                        pdf.getPage(1).then(function(page) {
                      
                          // Set up the canvas element to display the preview
                        //   var canvas = document.getElementById('preview-canvas');
                          let context = canvasRef.current.getContext('2d');
                          let viewport = page.getViewport({scale: 1.0});
                      
                          // Set the canvas dimensions to match the PDF page dimensions
                          canvasRef.current.width = viewport.width;
                          canvasRef.current.height = viewport.height;
                      
                          // Render the PDF page into the canvas context
                          page.render({
                            canvasContext: context,
                            viewport: viewport
                          });
                        });
                      });
                }
              else{
                let context = canvasRef.current.getContext("2d");
                // draw default file thumbnail
              }
        }
       
    },[])
  
    return  <div className="min-w-screen border border-black  relative min-h-screen z-20" style={{clipPath:"",display:vis  ? "flex":"none"}}  ref={modalRef}>
    <div className="w-[100%] h-[80%] absolute flex flex-col z-20 top-0 left-0 opacity-100 bg-white blur">
      </div>
      <div className="w-[60%] h-[70%] absolute flex flex-col z-40 top-[10%] left-[20%] opacity-100">
      <div className="mr-6 ml-auto mt-5" onClick={(e)=>{
        modalRef.current.style.display = "none";
      }}>x</div>
    <canvas className="w-[600px] h-[700px] border border-red-600" ref={canvasRef}></canvas>
    <form onSubmit={async(e)=>{
        
        e.preventDefault();
        let fd = new FormData();
        fd.append("file",vis);
        let res = await fetch("http://localhost:8080/upload",{
            body:fd,
            method:"POST",

        }).then((r) => r.json());
        let user = new User(getActiveChat().id);
        user.sendMessage(Buffer.from(capRef.current.value + ":::" + res.url,"utf8"),MessageTypes.File);
    }}>
      <input className="text-md mt-10 ml-6" type="submit" ref={capRef}></input>

    </form>
      </div>
    
      </div>
  
}