//@ts-check

/** @typedef {{verseRef:string, verseText:string, sermonRef:string, sermonText:string}} Section */

/** @type {Section[]} */
const Sections = [];

const Advance =()=>
{
    /** @type {Section} */
    let leading = {
        verseRef:"",
        verseText:"",
        sermonRef:"",
        sermonText:""
    };
    Sections.push(leading);
    return leading;
}

/** @type {(inString:string)=>boolean} */
const IsPassage =(inString)=>
{
    const words = inString.split(" ");
    return words.length<6 && /\d/.test(words[words.length-1]);
}

/** @type {(e:Element|null)=>void} flag an element for deletion*/
const ElFlag =el=>el?.setAttribute("data-remove", "true");
/** @type {(markup:string)=>void} delete flagged elements and replace with markup string*/
const ElKill =markup=>document.querySelectorAll("[data-remove]").forEach((e, i, arr)=>{
    if(i == arr.length-1)
    {
        e.insertAdjacentHTML("afterend", markup);
    }
    e.remove();
})


// 1) find all the sermon links
document.querySelectorAll("p a[href*='truthforlife.org/resources/sermon']").forEach(link=>
{
    let parent = /** @type {Element|null} */(link.parentElement);

    ElFlag(parent);

    if(parent)
    {
        let sibling;
        const section = Advance();
        section.sermonRef = link.outerHTML;
    
        // 2) go back until bible reference, collecting bible paragraphs
        sibling = parent;
        while(sibling)
        {
            sibling = sibling.previousElementSibling;
            if(sibling)
            {
                ElFlag(sibling);
                if(IsPassage(sibling.textContent||""))
                {
                    section.verseRef = sibling.innerHTML;
                    break;                    
                }
                else
                {
                    section.verseText = sibling.outerHTML + section.verseText;
                }          
            }
    
        }
        
        // 3) go forward until a bible reference or <hr/>, collecting sermon paragraphs
        sibling = parent;
        while(sibling)
        {
            sibling = sibling.nextElementSibling;
            if(sibling)
            {
                if(IsPassage(sibling.innerHTML) || sibling.nodeName == "HR")
                {
                    break;
                }
                else
                {
                    section.sermonText = section.sermonText + sibling.outerHTML;
                    ElFlag(sibling);
                }
            }
        }
    }
});

ElKill(
    Sections.map(s=>`
<div data-reference="bible">
    <strong>${s.verseRef}</strong>
    ${s.verseText}
</div>
<p data-reference="sermon">Commentary from the sermon ${s.sermonRef} by Alistair Begg:</p>
<div>
    ${s.sermonText}
</div>`).join("")
);
