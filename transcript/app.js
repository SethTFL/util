const PanelHTML = document.querySelector(".Editor.HTML");
const PanelDOM = document.querySelector(".Editor.DOM");
const StageHTML = document.querySelector(".Editor.HTML .Stage");
const StageDOM = document.querySelector(".Editor.DOM .Stage");
const FARFind = document.querySelector(".FAR.Find");
const FARReplace = document.querySelector(".FAR.Replace");

const LocalStoreWrite =()=> localStorage.setItem("transcript", JSON.stringify(History));
const LocalStoreRead =()=> {
    const storage = localStorage.getItem("transcript");
    return storage ? JSON.parse(storage) : [];
}

function FixDjangoFootnotes()
{
    ToDOM();
    FixFootnotes();
    ToHTML();
    navigator.clipboard.writeText(StageHTML.value);
    alert("Fixed and copied to clipboard!");
}

function FixMarkdown()
{

    const pullquotes = document.querySelectorAll("h6").forEach((h, i)=>{
        h.setAttribute("id", `pull-${i+1}`);
    })

    const links = document.querySelectorAll("p>a[href^='./#[']");
    const newFootnotes = [];
    for(let i=0; i<links.length; i++)
    {
        /** @type {HTMLAnchorElement} */
        const link = links[i];
        /** @type {HTMLElement} */
        const parent = link.parentElement;
        /** @type {HTMLAnchorElement} */
        const refLink = document.querySelector(`a[href='#${link.getAttribute("name")}']`);

        refLink.insertAdjacentHTML("afterEnd", `<sup class="footnote-ref"><a href="#fn${i+1}" id="fnref1">${i+1}</a></sup>`);
        refLink.remove();
        link.remove();
        newFootnotes.push(`
<li id="fn${i+1}" class="footnote-item">
    <p>${parent.innerHTML} <a href="#fnref${i+1}" class="footnote-backref">↩︎</a></p>
</li>`);

        if(i==links.length-1)
        {
            parent.insertAdjacentHTML("afterend", `<section class="footnotes">
    <ol class="footnotes-list">
        ${newFootnotes.join("")}
    </ol>
</section>`)
        }
        parent.remove();
    }
}

var Selection = {};
//// store function //////////////////////////
var History = LocalStoreRead();
var HistoryActive = false;
var HistoryArea = document.querySelector("dd .History");

function HistoryStore(inFunc, ...args)
{
    var i;
    var state;
    state =
    {
        HTML: "",
        Func: inFunc.name,
        Args: args
    };
    inFunc(...args);
    for(i=0; i<StageDOM.childNodes.length; i++)
    {
        state.HTML += (StageDOM.childNodes[i].outerHTML || StageDOM.childNodes[i].nodeValue);
    }
    HistoryActive = History.length;
    History.push(state);
    LocalStoreWrite();
    HistoryRender();
}
function HistoryRecall(inIndex)
{
    var match;
    match = History[inIndex];
    if(match)
    {
        SelectionRemove();
        HistoryActive = inIndex;
        StageDOM.innerHTML = match.HTML;
    }
    HistoryRender();
}
function HistoryPrune(inDeleteBefore)
{   
    if(inDeleteBefore)
    {
        History = History.slice(HistoryActive);
        HistoryActive = 0;
    }
    else
    {
        History = History.slice(0, HistoryActive+1);
    }
    LocalStoreWrite();
    HistoryRender();
}
function HistoryRender()
{
    var buttonsBefore, buttonsAfter;
    var i;
    
    let renderButtonHistory = (inOutput, inIndex) =>
    {
        return inOutput = inOutput + `<button title="Go to this point" onclick="HistoryRecall(${inIndex})">${History[inIndex].Func}</button> `;
    }
    let renderButtonDelete = (inOutput, inBefore) =>
    {
        let button = ` <button class="Delete" title="Purge ${inBefore ? `Undo` : `Redo` } History" onclick="HistoryPrune(${inBefore})">🗙</button> `;
        if(inBefore){ return button + inOutput; }
                else{ return inOutput + button; }
    };

    buttonsBefore = ``;
    for(i=0; i<HistoryActive; i++)
    {
        buttonsBefore = renderButtonHistory(buttonsBefore, i);
    }
    if(HistoryActive > 0)
    {
        buttonsBefore = renderButtonDelete(buttonsBefore, true);
    }

    buttonsAfter = ``;
    for(i=HistoryActive+1; i<History.length; i++)
    {
        buttonsAfter = renderButtonHistory(buttonsAfter, i);
    }
    if(HistoryActive < History.length-1)
    {
        buttonsAfter = renderButtonDelete(buttonsAfter, false);
    }

    HistoryArea.innerHTML = `
    <span class="Range Before" >${buttonsBefore} </span>
    <span class="Range Current"><button title="Active History Point" class="Active">${History[HistoryActive].Func}</button></span>
    <span class="Range After"  >${buttonsAfter}  </span>
    `;
}


//// utility functions ///////////////////////
function Iterate(inSelector, inProcessor)
{
    var i;
    var elements;
    elements = document.querySelectorAll(inSelector);
    for(i=0; i<elements.length; i++)
    {
        inProcessor(elements[i]);
    } 
}

function FindStrand(inElement, inRoot)
{
    var list = [inElement];
    while(inElement = inElement.parentNode)
    {
        if(inElement == inRoot)
        {
            return list.reverse();
        }
        if(inElement.nodeType != 3)
        {
            list.push(inElement);
        }
    }
    return false;
}
function FindBefore(inElement1, inElement2)
{
    var list;
    list = [inElement1];
    if(inElement1 == inElement2)
    {
        return list;
    }
    while(inElement1 = inElement1.nextSibling)
    {
        if(inElement1.nodeType != 3)
        {
            list.push(inElement1);
        }
        if(inElement1 == inElement2)
        {
            return list;
        }
    }
    return false;
}
function FindBetween(inElement1, inElement2)
{
    var before;

    before = FindBefore(inElement1, inElement2);
    if(before)
    {
        return before;
    }

    before = FindBefore(inElement2, inElement1);
    if(before)
    {
        return before;
    }

    return false;
}
//// commands ////////////////////////////////
function ToHTML()
{
    var text;
    var i;

    SelectionRemove();
    PanelHTML.style.display = "block";
    PanelDOM.style.display = "none";

    text = "";
    for(i=0; i<StageDOM.childNodes.length; i++)
    {
        text += (StageDOM.childNodes[i].outerHTML || StageDOM.childNodes[i].nodeValue);
    }

    StageHTML.value = text;
    StageHTML.scrollLeft = 0;
    StageHTML.scrollTop = 0;
}
function ToDOM()
{
    SelectionRemove();
    StageDOM.innerHTML = StageHTML.value;
    PanelHTML.style.display = "none";
    PanelDOM.style.display = "block";
}
function QuoteBlockCreate()
{
    var block;
    var i;

    block = document.createElement("blockquote");
    if(!Selection.Across)
    {
        return false;
    }

    StageDOM.insertBefore(block, Selection.Across[0]);

    for(i=0; i<Selection.Across.length; i++)
    {
        block.appendChild(Selection.Across[i]);
    }

    SelectionCreate(block);
}
function QuoteBlockRemove()
{
    var block;
    var i;
    var text;
    

    if(!Selection.Across)
    {
        return false;
    }
        
    block = Selection.Across[0];
    const selection = [];
    while(block.firstChild)
    {
        selection.push(block.firstChild);
        StageDOM.insertBefore(block.firstChild, block);
    }
    StageDOM.removeChild(block);
    SelectionCreate(...selection);
}
function GeneralElementsCompress()
{
    var text;
    var i;
    var p;

    if(!Selection.Across)
    {
        return false;
    }
    
    let fragment = new DocumentFragment();
    
    let paragraphs = [[]];
    let paragraph = paragraphs[0];
    for(i=0; i<Selection.Across.length; i++)
    {
        let current = Selection.Across[i];

        if(current.innerHTML == "&nbsp;")
        {
            paragraphs.push([]);
            paragraph = paragraphs[paragraphs.length-1];
        }
        else
        {
            paragraph.push(current.innerHTML);
        }
        
    }

    const lineBreak = ` 
`;
    const selection = [];
    for(i=0; i<paragraphs.length; i++)
    {
        let p = document.createElement("p");
        p.innerHTML = paragraphs[i].join(`<br/>${lineBreak}`)+`
`;
        fragment.append(p);
        fragment.append(document.createTextNode(lineBreak));
        selection.push(p);
    }
    
    StageDOM.insertBefore(fragment, Selection.Across[0]);
    for(i=0; i<Selection.Across.length; i++)
    {
        let current = Selection.Across[i];
        StageDOM.removeChild(current);
    }
    SelectionCreate(...selection);

    /*
    p = document.createElement("p");
    StageDOM.insertBefore(p, Selection.Across[0]);
    text = [];
    for(i=0; i<Selection.Across.length; i++)
    {
        let current = Selection.Across[i];
        text.push(current.innerHTML == "&nbsp;" ? "</p><p>" : current.innerHTML);
        StageDOM.removeChild(current);
    }

    p.innerHTML = text.join("<br>");
    */
    //SelectionCreate(fragment);
}
function GeneralElementsExpand()
{
    var text;
    var i;
    var p;

    if(!Selection.Across)
    {
        return false;
    }
    
    text = Selection.Across[0].innerHTML.split("<br>");

    for(i=0; i<text.length; i++)
    {
        p = document.createElement("p");
        p.innerHTML = text[i];
        StageDOM.insertBefore(p, Selection.Across[0]);
    }

    StageDOM.removeChild(Selection.Across[0]);
}
function GeneralElementsDestroy()
{
    var text;
    var i;
    var p;

    if(!Selection.Across)
    {
        return false;
    }

    for(i=0; i<Selection.Across.length; i++)
    {
        StageDOM.removeChild(Selection.Across[i]);
    }

}

function GeneralElementsBibleLink()
{
    const link = `<a href="https://www.truthforlife.org/bible/${Selection.Text.toLowerCase().replaceAll(" ", "+").replaceAll("–", "-").replaceAll(".", "")}">${Selection.Text}</a>`;
    Selection.Up[0].innerHTML = Selection.Up[0].innerHTML.replace(Selection.Text, link);

}

function QuotePullCreate()
{
    var quote, string;
    quote = document.createElement("h6");
    string = Selection.Text;
    string = string.charAt(0).toUpperCase() + string.slice(1);
    if(string[string.length-1] != ".")
    {
        string = string.concat(".");
    }
    quote.innerHTML = string;
    StageDOM.insertBefore(quote, Selection.Across[0]);
    SelectionCreate(quote);
}
function QuotePullRemove()/*unused*/
{
    if(!Selection.Across)
    {
        return;
    }
    if(Selection.Across[0].nodeName.toLowerCase() == "h6")
    {
        StageDOM.removeChild(Selection.Across[0]);
    }
}
function QuotePullMove(inDirection)
{
    var quote, reference;
    var selection;
    var range;

    if(!Selection.Across)
    {
        return;
    }

    quote = Selection.Across[0];
    if(quote.nodeName.toLowerCase() == "h6")
    {
        if(inDirection)
        {
            reference = quote.nextElementSibling.nextElementSibling;
        }
        else
        {
            reference = quote.previousElementSibling;
        }
        StageDOM.insertBefore(quote, reference);
        StageDOM.insertBefore(document.createTextNode('\n'), reference);
        SelectionCreate(quote);
    }
}
function QuotePullSpread()
{
    var i;
    var quotes;
    var quote;
    var children;
    var child;
    var paddingStart;
    var paddingEnd;
    var spacing;
    var encountered, inserted;
    var elInsert, elReference;

    quotes = StageDOM.querySelectorAll("h6");
    available = [];
    for(i=0; i<quotes.length; i++)
    {
        quote = quotes[i];
        quote.parentNode.removeChild(quote);
    }

    paddingStart = 2;
    paddingEnd = 2;
    children = [];
    for(i=paddingStart; i<StageDOM.children.length; i++)
    {
        child = StageDOM.children[i];
        if(child.nodeName.toLowerCase() == "hr")
        {
            children.splice(children.length-paddingEnd, paddingEnd);
            //console.log("found the hr at", i);
            break;
        }
        children.push(child);
    }
    //console.log("total children:", StageDOM.children.length, "eligible children:", children.length);

    spacing = Math.ceil( (children.length-(paddingStart+paddingEnd)) / quotes.length );
    encountered = 0;
    inserted = 0;

    for(i=0; i<children.length; i++)
    {
        encountered++;
        if(encountered == spacing)
        {
            elInsert = quotes[inserted];
            elReference = children[i];
            StageDOM.insertBefore(elInsert, elReference);
            StageDOM.insertBefore(document.createTextNode('\n'), elReference);
            encountered = 0;
            inserted++;
        }
    }
}
function FootnoteRemove(andPull)
{

    const reorder =()=>
    {
        const footnotes = [...document.querySelectorAll("a[name^='[']")];

        let numericFootnotes = [];

        footnotes.forEach((a, i, arr)=>
        {
            let name = a.getAttribute("name");
            let index = parseInt(name.substring(1));
            let isNumeric = index > -1;

            if(isNumeric)
            {
                let aOther = document.querySelector("a[href='#"+name+"']");
                numericFootnotes.push({a, aOther, name});

                const renamed = `[${numericFootnotes.length}]`;

                a.setAttribute("name", renamed);
                a.innerHTML = renamed;
                
                aOther.setAttribute("href", `#${renamed}`);
                aOther.innerHTML = renamed;
                
                console.log(`remapped "${name}" to "${renamed}"`);
            }
        })
    }

    var i;
    if(!Selection.Across)
    {
        return;
    }

    for(i=0; i<Selection.Across.length; i++)
    {
        var p = Selection.Across[i];
        var a = p.querySelector("a");
        if(!a)
        {
            continue;
        }
        var name = a.getAttribute("name");
        var otherA = document.querySelector("a[href='#"+name+"']");
        
        let index = parseInt(name.substring(1));
        let isNumeric = index > -1;

        if(andPull && isNumeric)
        {
            alert("Cannot make a pullquote from a bibliographic footnote");
            return false;
        }

        if(andPull)
        {
            var text = a.parentNode.innerHTML;

            quote = document.createElement("h6");
            quote.innerHTML = text.substring(text.indexOf("“")+1, text.indexOf("”"));
            StageDOM.insertBefore(quote, otherA.parentNode);
            StageDOM.insertBefore(document.createTextNode('\n'), otherA.parentNode);
        }

        otherA.parentNode.removeChild(otherA);
        p.parentNode.removeChild(p);

        if(!andPull && isNumeric)
        {
            reorder();
        }
    }
}
function FixTitles()
{
    function ProcessParagraph(inElement)
    {
        var prefix = "<strong>";
        var suffix = "</strong>";
        var replacement;
        if(inElement.innerHTML.substring(0, prefix.length) == prefix)
        {
            if(inElement.innerHTML.substring(inElement.innerHTML.length - suffix.length) == suffix)
            {
                replacement = document.createElement("h2");
                replacement.innerHTML = inElement.innerText;
                inElement.parentNode.replaceChild(replacement, inElement);
            }
        }
    }

    Iterate("p", ProcessParagraph);
}
function FixFootnotes()
{
    function ProcessCopy(inElement)
    {
        inElement.setAttribute("href", "#"+ (inElement.textContent || inElement.innerText));
    }
    function ProcessFootnote(inElement)
    {
        const number = inElement.textContent || inElement.innerText
        inElement.setAttribute("name", number);
        inElement.setAttribute("href", "./#"+number);
        inElement.removeAttribute("mce_href");
    }
    function ProcessPullquote(inElement)
    {
        inElement.setAttribute("name", inElement.textContent || inElement.innerText);
        inElement.removeAttribute("href");
        inElement.removeAttribute("mce_href");
        CleanPullquote(inElement.parentNode);
    }
    function CleanPullquote(inParagraph)
    {
        var i;
        var anchors;
        var contents;
        var quoteStart, quoteEnd;
        var quote;

        if(!inParagraph)
        {
            return false;
        }

        anchors = inParagraph.querySelectorAll("a");
        if(anchors.length == 0)
        {
            return false;
        }

        for(i=0; i<anchors.length; i++)
        {
            inParagraph.removeChild(anchors[i]);
        }
        contents = inParagraph.innerHTML.replace("&nbsp;", "");
        quoteStart = contents.indexOf("“");
        quoteEnd = contents.indexOf("”");
        
        if(quoteStart != -1)
        {
            if(quoteEnd != -1)
            {
                anchors[0].innerHTML = anchors[0].getAttribute("name") + " - OK";
                inParagraph.setAttribute("data-footnote", "good");
                inParagraph.innerHTML = anchors[0].outerHTML + " “" + contents.substring(quoteStart+1, quoteEnd) + "”";
                return true;
            }
        }
        inParagraph.appendChild(anchors[0]);
        anchors[0].innerHTML = anchors[0].getAttribute("name") + " - FIX";
        inParagraph.setAttribute("data-footnote", "bad");
        return false;
    }

    Iterate("a[href*='#_ftnref']", ProcessFootnote);
    Iterate("a[href*='#_ftn']", ProcessCopy)
    Iterate("a[href*='#_msoanchor']", ProcessPullquote);
    Iterate("a[href*='#_msocom']", ProcessCopy);


    const fixDjangoDescruction=()=>
    {
        // find footnotes with no href
        const as = StageDOM.querySelectorAll("a[name^='[']").forEach(anchor=>
        {
            if(!anchor.href)
            {
                // out an href on that is serviceable
                const index = anchor.getAttribute("name");
                anchor.setAttribute("href", "./#"+index);
                anchor.innerHTML = index;

                // take the "[N]" out of the subsequent text if its there
                const parent = anchor.parentElement;
                if(parent)
                {
                    const splitter = "</a>"
                    const [link, text] = parent.innerHTML.split(splitter);
                    const textFixed = text.replace(index, "")
                    parent.innerHTML = link + splitter + textFixed;
                }
            }
        })
    }
    fixDjangoDescruction();
}
function FixCruft()
{
    var pIntro, pNext, hrs
    
    pIntro = StageDOM.querySelector("p");
    pNext = pIntro.nextElementSibling;
    if(pIntro.innerHTML.indexOf("#") != -1 && pIntro.innerHTML.indexOf("<strong") != -1)
    {
        StageDOM.removeChild(pIntro);
    }
    if(pNext.innerHTML == "&nbsp;")
    {
        StageDOM.removeChild(pNext);
    }

    hrs = StageDOM.querySelectorAll("hr");
    if(hrs)
    {
        pNext = hrs[0].previousElementSibling;
        if(pNext.innerHTML == "&nbsp;")
        {
            StageDOM.removeChild(pNext);
        }
        if(hrs.length > 1)
        {
            StageDOM.removeChild(hrs[1]);
        }
    }
}

// see lessons for life vol 3
function FixMalformedCenter()
{
    let ps = Array.from(document.querySelectorAll("p"));
    let i;
    let pPullquotes = [];

    // collect pullquotes at the bottom of the page
    for(i=ps.length-1; i>=0; i--)
    {
        if(ps[i].querySelector("a")){ break; }
        pPullquotes.unshift(ps[i]);
    }
    // add a link to them
    pPullquotes.forEach((p, i)=>
    {
        let key = `[pull-${i}]`;
        p.innerHTML = `<a name="${key}">${key}</a>` + p.innerHTML;
    })

    // find the dividing hr
    let GetIndex = el => Array.from(el.parentNode.children).indexOf(el);
    let hr = document.querySelector("hr");
    let hrIndex = GetIndex(hr);
    console.log(hrIndex);

    let as = Array.from(document.querySelectorAll("a"));
    aFootnotesUpper = [];
    aPullquotesUpper = [];
    as.forEach(a=>
    {
        if(GetIndex(a.parentElement) > hrIndex)
        {
            return;
        }
        if(a.querySelector("sup"))
        {
            // is normal footnote
            aFootnotesUpper.push(a);
        }
        else
        {
            // is pull quote
            aPullquotesUpper.push(a);
        }
    });
    aFootnotesUpper.forEach(a=>a.innerHTML = a.innerText);
    aPullquotesUpper.forEach((a, i)=>
    {
        let key = `[pull-${i}]`;
        a.innerHTML = key;
        a.href = "#"+key;
    });
}

function FixNewlines()
{
    StageHTML.value = StageHTML.value.replace(/^\s*$(?:\r\n?|\n)/gm, "");
}
function FixCustom()
{
    StageHTML.value = StageHTML.value.split(FARFind.value).join(FARReplace.value);
}
function FixSpaceStrands()
{
    StageHTML.value.indexOf("&nbsp;&nbsp;")
}
function SelectionCreate(...elements)
{
    const DOMSelection =()=>
    {
        var selection;
        var pathStart, pathStop, pathBetween;
        var output;

        selection = window.getSelection();
        output = {
                Text: selection.toString(),
                Up: FindStrand(selection.anchorNode, StageDOM),
                Down: FindStrand(selection.focusNode, StageDOM),
            Across: false
        };
        if(output.Up && output.Down)
        {
            output.Across = FindBetween(output.Up[0], output.Down[0]);
        }
        return output;
    }

    const NodeSelection =(inElements)=>
    {
        window.getSelection().empty();
        return {Across:inElements};
    }

    if(Selection.Across)
    {
        for(i=0; i<Selection.Across.length; i++)
        {
            Selection.Across[i].removeAttribute("class");
        }
    }
    Selection = elements.length ? NodeSelection(elements) : DOMSelection();
    if(Selection.Across)
    {
        for(i=0; i<Selection.Across.length; i++)
        {
            Selection.Across[i].className = "Selection";
        }
        return true;
    }
    return false;
}

function SelectionRemove()
{
    window.getSelection().empty();
    if(Selection.Across)
    {
        for(i=0; i<Selection.Across.length; i++)
        {
            Selection.Across[i].removeAttribute("class");
        }
    }
    Selection.Across = false;
}


if(History.length)
{
    HistoryActive = History.length-1;
    StageHTML.value = History[HistoryActive].HTML;
    ToDOM();
    HistoryRender();
}
else
{
    ToHTML();
}




///////////// N bible verse on /////////////////
function FixNVersesOn()
{
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
    StageDOM.querySelectorAll("p a[href*='truthforlife.org/resources/sermon']").forEach(link=>
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
}