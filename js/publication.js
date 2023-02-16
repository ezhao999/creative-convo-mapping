//Needs Python web server to run
//python -m simpleHTTPServer 8000

// Global Variables ------------------------------------------------------------

var numHeroPics = 15; // 2 images are part of other convos
var maxConvoLength = 40; // Max lines of the CSV that a convo can be
var maxLineLength = 65; // From CSS, used to calculate ConvoLength - slightly more than x CH width
var sortedConvos = [];
var activeStages = [];
//var homeConvos = [];

var numRandomBlocks = 5;

var toBeParsed = "Discord_Convo_Merged.csv";
const user1 = "Fluffel"
const user2 = "FryingHamster"

//parsed CSV data to below
var discordData;

var currUser = user1;

var pics = document.getElementsByClassName("heropic");
var picGrid = document.getElementById("picFrame");
window.onload = function() {positionCards()};

// Home Page: Rearranging Cards ------------------------------------------------

function mapRange(value,a,b,c,d) { //maps value from range a > b to c > d
	value = (value - a) / (b - a);
  return c + value * (d - c);
}

function positionCards() {
  addCards();
  for(var i = 0; i < pics.length; i++) {
    console.log(i);
    var randAngle = mapRange(Math.random(), 0, 1, -0.5, 0.5) * 15;
    var randLinear = mapRange(Math.random(), 0, 1, -0.5, 0.5) * 10;
    
  	var proportion = (i) / pics.length;
  	var startangle = ((i+1) / pics.length) * (-Math.PI);
    var degrees = (startangle * (180 / Math.PI));
    var mappedDegrees = mapRange(degrees, 0, -180, -12, 12);
    var mappedLinear = mapRange(proportion, 0, 1, -40, 40);
    var mappedHeight = 30 * (0.5 + Math.sin(startangle));
    
	pics[i].style.transform += "translateY(" + (mappedHeight + randLinear) + "%)";
    pics[i].style.transform += "translateX(" + (mappedLinear + randLinear) + "%)";
    pics[i].style.transform += "rotateZ(" + (mappedDegrees + randAngle) + "deg)";
    pics[i].innerHTML = mappedDegrees + " , " + i;
    //console.log(70 * (0.5 - Math.cos(startangle)));
    console.log(randAngle);
    console.log(randLinear);

  }
}

function addCards() {
    //debugger;
    var index = 0;
    for (var i = 0; i < numHeroPics; i++) {
        console.log(i+1);
        if (i == 10 || i == 12) {
            continue;
        } else {
            index++;
            var image = document.createElement("img");
            image.id = (index) + "-img";
            image.src = "./cropped-mainart/" + (i+1) + ".jpg";
            image.className = "heropic";
            image.classList.add("inactive");
            document.getElementById("picFrame").appendChild(image);
            if(activeStages.indexOf(index-1) != -1){
                image.classList.remove("inactive");
                image.classList.add("active");
            }
            //console.log(i+1);
            //console.log("added attributes");

        }
    }
}

// function styleCards(){
//     var images = document.getElementsByClassName("hero-pic");
//     console.log(images);
//     var mutatedStages = [];
//     activeStages.forEach(element => {
//         var newVal = element + "-img";
//         mutatedStages.push(newVal);
//     });
//     console.log(mutatedStages);
//     Array.from(images).forEach(element => {
//         if (activeStages.indexOf(images.id) != -1){
//             element.classList.remove("inactive");
//             element.classList.add("active");
//         }
//     });
// }

function returnData(data, field) {
    for (let i = 1; i < data.length; i++) {
        console.log(data[i][field]);
    }

}
// Promise: Runs entire page after CSV load ------------------------------------

//Finish parsing CSV, then if successful, perform returnData().
//Else, show a timeout message in the console. 
let myPromise = new Promise(function (myResolve, myReject) {
    Papa.parse(toBeParsed, {
        dynamicTyping: true,
        download: true,
        delimiter: ',',
        header: true,
        complete: function (results) {
            discordData = results.data;
            console.log("Parsing complete:", results);
            myResolve(discordData);
        }
    });

    setTimeout(function () { myReject("Promise Error: Timeout") }, 5000);
});

myPromise.then(
    function (value) {
        csvToConvos(value, sortedConvos);
        console.log(sortedConvos);
        console.log(displayHomeTexts(sortedConvos, numRandomBlocks))
    },
    function (error) {
        console.log(error);
    },
);

/*

HIGH LEVEL CODE:

In conversation mode, when user clicks once, generate one text block based on the 
last starting position.

Type out the text letter by letter, save the last CSV position

repeat

Click behavior - starting from clicking on a "home" text block: 

Prompt user to click on the div after convo is complete, and if there is more convo:
Add a new div and shrink the opacity of the last

States: 

    1) Home - contains all 13 images and 5 randomly picked conversations
    2) Conversation - interactive click to turn conversation with stage-relevant hero images
    3) Title - Animation that follows the frame sequence in Figma


    - Home Page should have Button / Method to Access Title
        -Home page loads 5 random convo snippets with slight transitions
        -Load in a help button
        -When hovering over a convo snippet OR related image - dim opacity of everything except the snippet and image
    - Conversation may also display previous 2 conversations (for a background)
        - Follow webflow for example of how it should be laid out

    - Conversation should be click by click until done, multiple transitions:
        1) If at the end of a conversation array, add in a new div to continue, 
                And keep the convo going
        2) If at the end of a stage, outline the image or div as a nudge to click,
                Then take the user back to home page
*/

// Home Page Text Functions ----------------------------------------------------

function randomInt(min, max) {
    return Math.round(Math.random() * (max-min) + min);
}

function randomIntArray(formattedCSV, num) { //num is numRandomBlocks
    const upper = formattedCSV.length - 1;
    const lower = 0;
    const pickedStages = [];
    while (pickedStages.length < num){
        let testNum = randomInt(lower, upper);
        if (pickedStages.indexOf(testNum) == -1)
            pickedStages.push(testNum);
    }
    console.log(pickedStages);
    return pickedStages;
}

function pickRandomBlocks(formattedCSV, /*chosen,*/ num){
    var chosen = [];
    var stages = randomIntArray(formattedCSV, num); //number indices
    activeStages = stages;
    for (let i = 0; i < num; i++){
        //push first line of chosen convos into home convo array
        chosen.push(formattedCSV[stages[i]][0][1]);
    }
    return [chosen, stages];
}

function displayHomeTexts(formattedCSV, num){ // also contains image dimming
    var images = document.body.getElementsByClassName("heropic");
    var source = pickRandomBlocks(formattedCSV, num);
    var stages = source[1];
    var homeTexts = [];
    for (const obj of source[0]){
        console.log(obj["content"]);
        homeTexts.push(obj["content"]);
    }
    /*
        For each text in hometexts:
        Create new element:
        - Structure (see webflow):
            -Outer Div
                -Inner text (height set)
                -Inner text
        Inner text (height set) - content = text
        Inner text = text OR start typing out
        Id = stage at index of for loop
        Class = Evens are left, Odds are right

    */
    for (let i = 0; i < homeTexts.length; i++){ 
        var block = createHTMLBlock(homeTexts[i], stages[i], false, i);
        block.onmouseenter = function() {focus(this)};
        block.onmouseleave = function() {unFocus(this)};
        block.onclick = function() {onClickConvo({obj:this, isStart:true})};
        document.getElementById("main-textFrame").appendChild(block);
        //append said HTML block to the website
    }

    console.log(images.length);
    console.log(`homeTexts: ${homeTexts}`);
    console.log(`stages: ${stages}`);
}

function createHTMLBlock (text, index, isConvo, isOdd, user) {
    // text: mandatory (content)
    // index: mandatory (will populate into id)
    // isConvo: mandatory (determines class behaviors)
    // isOdd: optional (only for home screen purposes)
    // user: optional (only for user usage)
    var container = document.createElement("div");
    var innerText = document.createElement("p");
    var innerTextHeight = document.createElement("p");

    container.appendChild(innerText);
    container.appendChild(innerTextHeight);
    
    container.id = (index + 1)/* + "-text"*/;

    innerText.classList.add("inner-text");
    innerTextHeight.classList.add("inner-text", "height-set");

    container.classList.add("convo-block")
    if (isConvo){
        if (user == user2){
            container.classList.add("right", "user2");
        }
    } else {
        container.classList.add("home");
        if(isOdd % 2 == 1){
            container.classList.add("right");
        }
    }
    innerTextHeight.innerHTML = text;
    //add an if statement that includes typing for convos
    innerText.innerHTML = text;

    return container;
}

// On hover functions ----------------------------------------------------------

function focus(obj) {
    const allInactive = document.body.getElementsByClassName("convo-block");
    const allPics = document.body.getElementsByClassName("heropic");
    // For each home text, set to inactive unless it is the hovered object, in which case set to active
    Array.from(allInactive).forEach(element => {
        if(element != obj){
            element.classList.add("unfocused");
        } else {
            element.classList.add("active");
        }
    });

    Array.from(allPics).forEach(element => {
        if(element.id != obj.id + "-img"){
            element.classList.add("unfocused");
        } else {
            element.classList.add("active");
        }
    });

}

function unFocus(obj) {
    const allInactive = document.body.getElementsByClassName("convo-block");
    const allPics = document.body.getElementsByClassName("heropic");
    Array.from(allInactive).forEach(element => {
        if(element != obj){
            element.classList.remove("unfocused");
        } else {
            element.classList.remove("active");
        }
    });

    Array.from(allPics).forEach(element => {
        if(element.id != obj.id + "-img"){
            element.classList.remove("unfocused");
        } else {
            element.classList.remove("active");
        }
    });
}

// Turning CSV into formatted conversations ------------------------------------

function csvToConvos(parsedCSV, result) { 
    /*
        Function: Separates parsed CSV into more organized "chunks"
        1: Chunks cannot exceed 40 lines, calculated by createBlock
        2: Chunks end as soon as the next stage is hit (even if not at line limit)
        3: Data structure: One array of length [number of stages in CSV] >>
                           Multiple arrays of text blocks that each equal <40 lines >>
                           Blocks that contain user-by-user text and some metadata

    */
    let currLine = 0;
    let currStage = 1;
    let lineCount = 0;
    let imgCount = 0; // pass into createBlock to give a number 
    let multiConvo = []; //contains all singleConvos needed to make up one stage
    let singleConvo = []; //single array of <40 line convo
    let convoEnd = false;

    while (currLine < parsedCSV.length) {

        while (lineCount < maxConvoLength){
        //keep filling array until 40 lines are met
            if(parsedCSV[currLine]["Stage"] != currStage){ //stop adding lines if next stage
                currStage++;
                convoEnd = true;
                break;
            }
            let block = createBlock(parsedCSV, currLine);
            if(lineCount + block.height > maxConvoLength){ //don't add block if it will exceed limit
                break;
            }
            else {
                singleConvo.push(block);
                lineCount += block["height"];
                currLine = (block["lastLine"]); //How to keep track of which line in CSV?
                if(currLine > parsedCSV.length-1){ //Index out of bounds guard
                    convoEnd = true;
                    break;
                }
            }
        }

        lineCount = 0;
        if(singleConvo.length){
            multiConvo.push(singleConvo);
            singleConvo = [];
        }

        if (convoEnd){
            result.push(multiConvo);
            multiConvo = [];
            convoEnd = false;
        }

    }
}

function createBlock(parsedCSV, position) { //ONLY USED AS HELPER FOR csvToConvos
    // length logic:
    // 1) newlines count as extra line
    // 2) if current CSV line exceeds 40 chars, add Math.ceil(length/maxLineLength)
    //debugger;

    var str = "";
    var lineCt = 0;
    var isImage = false;
    let isHero = false;

    var user = parsedCSV[position]["Username"];
    //console.log("starting line " + position);
        const startPos = position;

        while(parsedCSV[position]["Username"] == user){

            if (parsedCSV[position]["Link"]){
                if(str)
                    break;
                else 
                isImage = true;
                isHero = parsedCSV[position]["isHero"];
                position++;
                break;
            }

            // If text is not empty, concatenate w existing str
            if (str != ""){
                //str += "\n\n"; //add one empty line, then continue adding
                str += "</br></br>"; //add one empty line, then continue adding

            }

            // For each CSV content, figure out additional line height
            let currStr = parsedCSV[position]["Content"];
            str += currStr;
            lineCt += Math.ceil(currStr.length / maxLineLength) + 1;
            

            //Iterate to next CSV line. If index is out of bounds, break the loop
            position++;
            if (position > parsedCSV.length - 1)
                break;

        }

    const newBlock = {
        user: user,
        content: str,
        height: lineCt,
        isImage: isImage,
        isHero: isHero,
        lastLine: position
    }
    return newBlock;
}

// Animation / Interaction Code ------------------------------------------------

function typeText(div, text, pos) { //types out convo block
    console.log(div);
    const speed = 25;

    if (pos < text.length) {
        document.getElementById(div).innerHTML += text.charAt(pos);
        console.log(text.charAt(pos));
        pos++;
        setTimeout(function() {typeText(div, text, pos)}, speed);
    } else {
        console.log(`Setting onclick for ${div}`);
        document.getElementById(div).onclick = function() {onClickConvo(div, discordData, currLine)};
    }
}

// function onClickConvo(clickID, parsedCSV, position){ //sets onlick attribute for target clickID
//     document.getElementById(clickID).onclick = null;
//     document.getElementById(clickID).removeAttribute("id");

//     content = createBlock(parsedCSV, position).content; //CHANGE THIS LINE IF CREATEBLOCK IS CHANGED TOO
//     // newBlock = blockToDiv(content);
//     newBlock = document.createElement("p");
//     if(parsedCSV[position]["Username"] == user1)
//         newBlock.className = "user1";
//     else
//         newBlock.className = "user2";
//     newBlock.id = "Current";
//     newBlock.style = "white-space: pre-wrap;";
//     document.body.appendChild(newBlock);

//     typeText(newBlock.id, content, 0);
// }
/* Click function:

1) Each home div needs an onclick to start their respective conversations

2) Start convo:
    - Delete current div
    - Delete all images
    - 
*/
function onClickConvo({obj, formattedCSV, stage, substage, isStart}){
    var images = document.getElementsByClassName("heropic");
    Array.from(images).forEach(element => {
        if(element.id != obj.id + "-img"){
            element.classList.remove("inactive");
            element.classList.remove("unfocused");
            element.classList.add("disabled");
        } else {
            element.style.transform = "";
        }
    })
    if (isStart) {
        var heroTexts = document.getElementsByClassName("convo-block");
        Array.from(heroTexts).forEach(element => {
            element.remove();
        });
    }
}
