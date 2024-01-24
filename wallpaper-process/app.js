import * as Preact from "https://esm.sh/preact@10.19.3";
import {createElement as H} from "https://esm.sh/preact@10.19.3";
import * as Signal from "https://esm.sh/@preact/signals@1.2.1?deps=preact@10.19.3";

/** @typedef {{file:File, image:HTMLImageElement}} FileImagePair */
/** @typedef {{directory?:FileSystemDirectoryHandle, all:FileImagePair[], matched:FileImagePair[], unmatched:FileImagePair[]}} FSState */
/** @typedef {[name:string, width:number, height:number]} SizeArg */
/** @typedef {{name:string, width:number, height:number, files:FileImagePair[]}} Size */

const Files = Signal.signal( /** @type {FSState}*/({directory:null, all:[], matched:[], unmatched:[]}) );

const Sizes = (/** @type {SizeArg[]} */[
    ["1280x1024", 1280, 1024],
    ["1920x1080", 1920, 1080],
    ["amazon-fire", 2560, 1600],
    ["android", 1440, 2960],
    ["blog", 1200, 675],
    ["facebook-banner", 851, 315 ],
    ["facebook", 1200, 628 ],
    ["insta-story-1", 1080, 1920 ],
    ["insta-story-2", 1080, 1920 ],
    ["instagram", 1080, 1080 ],
    ["ipad", 2160, 1620 ],
    ["iphone", 1170, 2532 ],
    ["microsoft-surface", 2880, 1920 ],
    ["twitter", 1200, 675 ]
]).map(([name, width, height])=>Signal.signal(/**@type {Size} */({name, width, height, files:[]})))
const Drag = Signal.signal(null);


/** @type {(inFile:File)=>Promise<HTMLImageElement>} */
const Measure =(inFile)=>new Promise((accept)=>{
    const image = new Image();
    const reader = new FileReader();
    image.addEventListener("load", ()=>accept(image));
    reader.addEventListener("load", ()=>image.src = reader.result);
    reader.readAsDataURL(inFile);
});

const Load=async()=>{
    /** @type {FileSystemDirectoryHandle} */
    const handle = await window.showDirectoryPicker();
    /** @type {FileImagePair[]} */
    const all = [];
    /** @type {FileImagePair[]} */
    const matched = [];
    /** @type {FileImagePair[]} */
    const unmatched = [];

    Sizes.forEach(s=>s.value.files = []);
    for await (const file of handle.entries())
    {
        const data = await file[1].getFile(); 
        const image = await Measure(data);
        /** @type {FileImagePair} */
        const pair = {file, image};
        all.push(pair);
        const matches = Sizes.filter((s, i, arr)=>(s.value.width == image.width) && (s.value.height == image.height));
        const [fileName, fileExt] = /** @type {string} */(file[0]).toLowerCase().split(".");
        let bestMatch = matches[0];
        for(let i=0; i<matches.length; i++)
        {
            if(fileName.endsWith(matches[i].value.name))
            {
                bestMatch = matches[i];
                break;
            }
        }
        if(bestMatch)
        {
            bestMatch.value = {...bestMatch.value, files:[...bestMatch.value.files, pair ]}
            matched.push(pair);
        }
        else
        {
            unmatched.push(pair);
        }
    }
    Files.value = /** @type {FSState} */({directory:handle, all, matched, unmatched});
};

const App=()=>
{
    return H("div", {class:""}, [
        H("div", {class:"p-4 bg-yellow-500", onclick:Load}, Files.value.directory?.name ? `Folder: "${Files.value.directory.name}"` : "Open Folder"),
        (Files.value.unmatched.length > 0) && H("div", {}, [
            H("div", {class:"text(lg center) p-4"}, "Unmatched files:"),
            H("div", {class:"flex flex-row gap-4 flex-wrap justify-center"}, Files.value.unmatched.map((/**@type {FileImagePair}*/fip)=>
            {
                const wide = fip.image.width > fip.image.height;

                return H("div", {class:`rounded-lg text-center bg-slate-200 text-slate-800`},
                
                    H("div", {}, [
                        H("img", {class:`block ${wide?"w-64 h-auto":"w-auto h-64"}`, src:fip.image.src}),
                        H("div", {class:"inline-block px-1 rounded-full relative -top-8 bg-black text(xs white)"}, fip.file[0])
                    ])
                )
            }))
        ]),
        H("div", {class:"text(lg center) p-4"}, "Sizes:"),
        H("div", {class:"flex flex-row gap-4 flex-wrap justify-center"}, Sizes.map(signal=>
        {
            const value = signal.value;
            const wide = value.width > value.height;
            const count = value.files?.length || 0;
            const message = count ? (count == 1 ? "Good!" : "Too Many!") : "Missing!";
            const highlight = (Drag.value && Drag.value.signal !== signal) && (Drag.value.fip.image.width == value.width && Drag.value.fip.image.height == value.height);

            return H("div", {
                onDragOver:e=>e.preventDefault(),
                onDrop:e=>{
                    console.log("dropping", highlight);
                    if(highlight)
                    {
                        signal.value = {...signal.value, files:[...signal.value.files, Drag.value.fip]};
                        const otherSignal = Drag.value.signal;
                        otherSignal.value = {...otherSignal.value, files:otherSignal.value.files.filter(f=>f!=Drag.value.fip)};
                    }
                },
                class:`rounded-lg ${highlight && "border(2 green-500)"} text-center ${count !== 1 ? "bg-red-500 text-white" : "bg-slate-200 text-slate-800"}`},
            [
                H("div", {class:"p-2 font-black"}, value.name),
                H("div", {}, message),
                H("div", {class:`flex ${wide?"flex-col":"flex-row"}`}, value.files.map((fip)=>{
                    return H("div", {key:fip.file[0], draggable:true,
                        onDragStart:(e)=>{
                            e.dataTransfer.effectAllowed = "move";
                            Drag.value = {signal, fip};
                        },
                        onDragEnd:()=>{Drag.value = null; console.log("drag done")}
                        }, [
                        H("img", {class:`block ${wide?"w-64 h-auto":"w-auto h-64"}`, src:fip.image.src}),
                        H("div", {class:"inline-block px-1 rounded-full relative -top-8 bg-black text(xs white)"}, fip.file[0])
                    ]);
                }))
            ])
        })),
        Files.value.directory ? H("div", {}, [
            H(Uploader),
        ]) : H("p", {}, "select a folder before uploading")
    ])
};

const StorageKey = "hs-api-key";
const HSFilePrefix = Signal.signal(Files.value?.directory?.name || "[enter prfix]");
const HSAPIKey = Signal.signal(localStorage.getItem(StorageKey)||"[enter key]");
const HSProcessing = Signal.signal(false);

Signal.effect(()=>{
    const name = Files.value?.directory?.name;
    name && (HSFilePrefix.value = name);
});

const Upload =async()=>
{
    HSProcessing.value = true;    

    /** @type {(endpoint:string, payload:Record<string, string>)=> Record<string, string>} */
    async function APICall(endpoint, payload=false)
    {
        const params = {
            method: payload ? "POST" : "GET",
            headers:{authorization: `Bearer ${HSAPIKey.value}`}
        };
        if(payload)
        {
            if(!(payload instanceof FormData))
            {
                params.headers["content-type"] = "application/json";
                params.body = JSON.stringify(payload);
            }
            else
            {
                params.body = payload;
            }
        }

        const resp = await fetch(`https://the-proxinator.deno.dev/https://api.hubapi.com/files/v3/${endpoint}`, params);
        const json = await resp.json();
        return json;
    }

    try
    {
        const folder = await APICall("folders", {
            parentFolderId:"2807953303",
            name:HSFilePrefix.value
        });
    
        if(folder.id)
        {
            for await (const size of Sizes)
            {
                const testFile = await size.value.files[0].file[1].getFile();
                const form = new FormData();
                form.append("file", testFile);
                form.append("folderId", folder.id);
                form.append("fileName", HSFilePrefix.value+"-"+size.value.name+".jpg");
                form.append("options", JSON.stringify({access: "PUBLIC_INDEXABLE", overwrite:true}));
        
                const resp = await APICall("files", form);
                console.log(resp);
            }

        }
    }
    catch(e)
    {
        console.log(e);
    }


    HSProcessing.value = false;
}

const Uploader =()=>
{
    
    return H("div", {}, [
        H("span", {}, "File Prefix:"),
        H("input", {type:"text", value: HSFilePrefix.value, onInput(e){HSFilePrefix.value = e.target.value}}),

        H("p", { class:"text-slate-500"}, HSFilePrefix.value),

        H("span", {}, "API Key:"),
        H("input", {type:"text", value: HSAPIKey.value, onChange(/** @type {InputEvent} */e)
        {
            localStorage.setItem(StorageKey, e.target.value);
        }}),

        !HSProcessing.value && H("button", {
            class:`p-4 bg-red-500 text-white`,
            onClick:Upload
        }, "test call")
    ]);
}

Preact.render(H(App), document.querySelector("#app"))