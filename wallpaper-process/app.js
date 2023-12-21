import * as Preact from "https://esm.sh/preact@10.19.3";
import {createElement as H} from "https://esm.sh/preact@10.19.3";
import * as Signal from "https://esm.sh/@preact/signals@1.2.1?deps=preact@10.19.3";

/** @typedef {{file:File, image:HTMLImageElement}} FileImagePair */
/** @typedef {{directory?:FileSystemDirectoryHandle, files:FileImagePair[]}} FSState */
/** @typedef {[name:string, width:number, height:number]} SizeArg */
/** @typedef {{name:string, width:number, height:number, files:FileImagePair[]}} Size */

const Files = Signal.signal(/** @type {FSState} */({directory:null, files:[]}));
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

/** @type {(inFile:File)=>Promise<HTMLImageElement>} */
const Measure =async(inFile)=>new Promise((accept, reject)=>{
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
    const files = [];
    Sizes.forEach(s=>s.value.files = []);
    for await (const file of handle.entries())
    {
        const data = await file[1].getFile(); 
        const image = await Measure(data);
        /** @type {FileImagePair} */
        const pair = {file, image};
        files.push(pair);
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
        bestMatch && (bestMatch.value = {...bestMatch.value, files:[...bestMatch.value.files, pair ]});
    }
    Files.value = {directory:handle, files};

};

const App=()=>
{
    return H("div", {class:""}, [
        H("div", {class:"p-4 bg-yellow-500", onclick:Load}, Files.value.directory?.name ? `Folder: "${Files.value.directory.name}"` : "Open Folder"),
        H("div", {class:"text(lg center) p-4"}, "Sizes:"),
        H("div", {class:"flex flex-row gap-4 flex-wrap justify-center"}, Sizes.map(({value})=>
        {
            const wide = value.width > value.height;
            const count = value.files?.length || 0;
            const message = count ? (count == 1 ? "Good!" : "Too Many!") : "Missing!";

            return H("div", {class:`rounded-lg text-center ${count !== 1 ? "bg-red-500 text-white" : "bg-slate-200 text-slate-800"}`},
            [
                H("div", {class:"p-2 font-black"}, value.name),
                H("div", {}, message),
                H("div", {class:`flex ${wide?"flex-col":"flex-row"}`}, value.files.map((fip)=>{
                    return H("div", {}, [
                        H("img", {class:`block ${wide?"w-64 h-auto":"w-auto h-64"}`, src:fip.image.src}),
                        H("div", {class:"inline-block px-1 rounded-full relative -top-8 bg-black text(xs white)"}, fip.file[0])
                    ]);
                }))
            ])
        }))
    ])
}

Preact.render(H(App), document.querySelector("#app"))
