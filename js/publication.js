// A Piece about Creative Anxiety about a Piece about Social Anxiety
// Last updated: 3-4-2023
// Current progress: Working copy of the turn-by-turn convo visualization,
//                   including showing images and longer conversations
//                   Stylistically finished
// Future goals: Add in sound interaction? Custom sounds for each convo

// Global Variables ------------------------------------------------------------

const numHeroPics = 15; // 2 images are part of other convos
const maxConvoLength = 40; // Max lines of the CSV that a convo can be
const maxLineLength = 65; // From CSS, used to calculate ConvoLength - slightly more than x CH width

// more CSS variables:
const blockFont = 0.75; // in vw
const blockHeight = 1; // in vw
const blockWidth = 60; // in ch, convo block width
const blockPad = 50; // in px
const frameSize = 100; //in percent

const opacity = 0.4; //in units, for conversations with multiple pages
const margin = 0.15; //in vw, for conversations with multiple pages


var sortedConvos = [];
var activeStages = [];
var activeImages = [];
var turnsSinceImages = [];

var numRandomBlocks = 5;

var toBeParsed = "Discord_Convo_Merged.csv";
const user1 = "Fluffel";
const user2 = "FryingHamster";

//parsed CSV data to below
var discordData;

var pics = document.getElementsByClassName("heropic");

// Home Page: Rearranging Cards ------------------------------------------------

window.onload = function() {addCards(); positionCards();};

function mapRange(value,a,b,c,d) { //maps value from range a > b to c > d
	value = (value - a) / (b - a);
    return c + value * (d - c);
}

function positionCards() {
    for(var i = 0; i < pics.length; i++) {
        console.log(i);
        var randAngle = mapRange(Math.random(), 0, 1, -0.5, 0.5) * 15;
        var randLinear = mapRange(Math.random(), 0, 1, -0.5, 0.5) * 10;
        
        var proportion = (i) / pics.length;
        var startangle = ((i+1) / pics.length) * (-Math.PI);
        var degrees = (startangle * (180 / Math.PI));
        var mappedDegrees = mapRange(degrees, 0, -180, -12, 12);
        var mappedLinear = mapRange(proportion, 0, 1, -40, 40);
        var mappedHeight = (30 * (0.5 + Math.sin(startangle))) + 5;
        
        pics[i].style.transform += "translateY(" + (1.25*(mappedHeight + randLinear)) + "%)";
        pics[i].style.transform += "translateX(" + (1.25*(mappedLinear + randLinear)) + "%)";
        pics[i].style.transform += "rotateZ(" + (mappedDegrees + randAngle) + "deg)";
        //pics[i].innerHTML = i + 1;
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
            var wrapper = document.createElement("div");
            var image = document.createElement("img");

            image.src = "./cropped-mainart/" + (i+1) + ".jpg";
            image.className = "content";

            wrapper.id = (index) + "-img";
            wrapper.className = "heropic";
            wrapper.classList.add("inactive");

            wrapper.appendChild(image);
            document.getElementById("picFrame").appendChild(wrapper);

            if(activeStages.indexOf(index-1) != -1){
                wrapper.classList.remove("inactive");
                wrapper.classList.add("active");
            }
            //console.log(i+1);
            //console.log("added attributes");

        }
    }
}

function returnData(data, field) {
    for (let i = 1; i < data.length; i++) {
        console.log(data[i][field]);
    }

}
// Promise: Runs entire page after CSV load ------------------------------------

// Finish parsing CSV, then if successful, perform returnData().
// Else, show a timeout message in the console. 
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

    for (let i = 0; i < homeTexts.length; i++){ 
        var block = createHTMLBlock(homeTexts[i], stages[i], false, i);
        block.onmouseenter = function() {focus(this)};
        block.onmouseleave = function() {unFocus(this)};
        block.onclick = function() {startConvo(this, sortedConvos)};
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
    // isConvo: mandatory - (determines class behaviors)
    // isOdd: optional (only for home screen purposes)
    // user: optional (only for user usage)

    // For convos: index refers to the nth turn in a convo, not the stage
    var container = document.createElement("div");
    var innerText = document.createElement("p");
    var innerTextHeight = document.createElement("p");

    container.appendChild(innerText);
    container.appendChild(innerTextHeight);
    
    container.id = (index + 1)/* + "-text"*/;

    innerText.classList.add("inner-text");
    innerTextHeight.classList.add("inner-text", "height-set");

    container.classList.add("convo-block");

    //styles and populates blocks based on home text or within a clicked convo
    if (isConvo){
        if (user == user2){
            container.classList.add("right", "user2");
        }
        //container.onclick = typeText(/*parameters*/);
    } else {
        container.classList.add("home");
        if(isOdd % 2 == 1){
            container.classList.add("right");
        }
        innerText.innerHTML = text;
    }
    innerTextHeight.innerHTML = text;

    return container;
}

function createImage(isHero, id) {
    // used for convo images only
    // identical to the addCards() code, but 
    var wrapper = document.createElement("div");
    var image = document.createElement('img');

    image.src = "./cropped_doodles/" + id + ".jpg";
    image.className = "content";

    wrapper.id = id;
    wrapper.className = "convopic";
    if (isHero) wrapper.classList.add("large");

    wrapper.appendChild(image);
    return wrapper;
}

function positionImage(obj) {
    console.log(obj.classList);
    if (obj.classList.contains("heropic") == false){
        console.log("not a heropic");
        if (obj.classList.contains("large") == false){
            console.log("small image " + obj.id);
            var mapX = mapRange(Math.random(), 0, 1, 17.5, 41.5);
            var mapY = mapRange(Math.random(), 0, 1, -5.0, 25.0);
        } else {
            console.log("large image " + obj.id);
            var mapX = mapRange(Math.random(), 0, 1, 17.5, 22.5);
            var mapY = mapRange(Math.random(), 0, 1, 0, 5.0);
        }
        obj.style.transform += "translateX(" + mapX + "vw)";
        obj.style.transform += "translateY(" + mapY + "vw)";
    }

    var mapAngle = mapRange(Math.random(), 0, 1, -0.5, 0.5) * 15;
    obj.style.transform += "rotateZ(" + mapAngle + "deg)";

}

function onclickImage(obj) {
    image = obj.firstChild;
    image.style.opacity = 1;
    obj.style.border = "transparent";
    obj.style.backgroundColor = "transparent";
    obj.style.cursor = "default";


    activeImages.push(obj);
    turnsSinceImages.push(0);
    console.log(activeImages);
    console.log(turnsSinceImages);
}

// On hover functions ----------------------------------------------------------

function focus(obj) {
    const allInactive = document.body.getElementsByClassName("convo-block");
    const allPics = document.body.getElementsByClassName("heropic");
    // For each home text, set to inactive unless it is the hovered object, in which case set to active
    Array.from(allInactive).forEach(element => {
        if(element != obj){
            element.classList.add("inactive");
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
            element.classList.remove("inactive");
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

    var str = "";
    var lineCt = 0;
    var isImage = false;
    let isHero = false;

    var user = parsedCSV[position]["Username"];
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

function newFrame(){
    var frame = document.createElement("div");
    frame.classList.add("frame", "current");
    frame.id = "currentConvo";
    frame.style.zIndex = 2;
    return frame
}

function startConvo(obj, formattedCSV){
    // Add a new div, render it on top of all existing content
    var container = document.getElementsByClassName("container");
    var convoDiv = document.createElement("div");
    var convoDiv = newFrame();

    // gets all pics on home screen, then deletes all that aren't relevant
    var images = document.getElementsByClassName("heropic");
    Array.from(images).forEach(element => {
        if(element.id != obj.id + "-img"){
            element.classList.remove("inactive");
            element.classList.remove("unfocused");
            element.classList.add("disabled");
        } else {
            element.style.transform = "";
            positionImage(element);
            element.style.transform += "scale(1.2)";

        }
    })

    // Call createHTMLBlock() for the second element of the conversation
    var index = parseInt(obj.id) - 1; //off by one correction
    var nextText = 2;
    var turn = formattedCSV[index][0][nextText];
    var isImage = turn["isImage"];

    // block is the conversation turn that comes right after
    if (isImage) {
        let imgPos = 1;
        let id = (index+1) + "-" + imgPos;
        var block = createImage(turn["isHero"], id);
        positionImage(block);
        //document.getElementById("picFrame").appendChild(block);
        block.onclick = function() {
            onclickImage(this);
            onClickConvo(this, formattedCSV, index, 0, nextText, 0, imgPos);
        };
    } else {
        var block = createHTMLBlock(turn["content"], nextText, true, undefined,
                                    turn["user"]); 
        block.onclick = function() {onClickConvo(this, formattedCSV, index, 0, nextText, 0, 0)};
    }
    // home texts generated without user, so we need to find the user again
    var startUser = formattedCSV[index][0][1]["user"];

    var heroTexts = document.getElementsByClassName("convo-block");
    Array.from(heroTexts).forEach(element => {
        if(element.id == obj.id){
            element.style.opacity = 1
            element.style.borderColor = "transparent";
            element.style.cursor = "default";
            element.classList.remove("right");
            element.onclick = null;

            element.id = "";

            if (startUser == user2){
                console.log(startUser);
                element.classList.add("right");
                element.classList.add("user2");
            }
            convoDiv.appendChild(element); 
            // set onClickConvo
            setTimeout(function(){element.classList.remove("home");}, 50);
        }
        else 
            element.remove();
    });

    convoDiv.appendChild(block);
    container[0].appendChild(convoDiv);
}


function onClickConvo(obj, formattedCSV, stage, subStage, turnNum, pos, imgPos){ //Applied to every convo block, with changing parameters

    // obj > target element to add text to
    // stage > current convo stage
    // subStage > which sub-array of the stage are we at so far?
    // turnNum > which turn of the convo are we at?
    // pos > counter for which character to type out next
    // imgPos > for supplemental images
    const speed = 20;
    let text = formattedCSV[stage][subStage][turnNum]["content"];
    obj.style.opacity = 1;
    obj.style.borderColor = "transparent";
    obj.style.backgroundColor = "transparent";
    obj.style.cursor = "default";
    obj.onclick = "";

    // Typing function
    if (pos < text.length) {
        char = text.charAt(pos);
        if(char == "<"){
            pos += 4;
            char = "<br/>";
        }
        obj.firstChild.innerHTML += char;
        pos++;
        setTimeout(function() {onClickConvo(obj, formattedCSV, stage, subStage, turnNum, pos, imgPos)}, speed);
    } else {
        // Nutshell: Manage the creation of a new block

        // Figure out next block of text
        setTimeout(function(){

            // update turns since each image was displayed
            if(turnsSinceImages.length > 0){
                for (let i = 0; i < turnsSinceImages.length; i++){
                    turnsSinceImages[i]++;
                }

                for (let i = 0; i < activeImages.length; i++){
                    element = activeImages[i];
                    turns = turnsSinceImages[i];
                    element.style.opacity = Math.max(styleCurve(1, turns, 1), 0.6);
                    console.log("opacity set to " + styleCurve(1, turns, 1));
                }
            }

            if (turnNum >= formattedCSV[stage][subStage].length - 1){
                turnNum = 0;
    
                if (subStage >= formattedCSV[stage].length - 1){
                    subStage = 0;
                    // NOTE: stop adding blocks, and populate home screen again
                    setTimeout(function() {resetHome(formattedCSV, numRandomBlocks)}, 1250);
                    return;
                    // Set the current image onclick to be resetHome
                } else {
                    subStage++;
    
                    // shrink all previous arrays accordingly
                    // NOTE: may need to reverse array
                    let frames = Array.from(document.getElementsByClassName("frame")).reverse();
                    let convoPics = Array.from(document.getElementsByClassName("convopic"));


                    convoPics.forEach(pic => {
                        pic.style.opacity = 1;
                    })
                    frames = frames.filter(frame => frame.className == "frame" || frame.className == "frame current");
                    console.log(frames.length);
                    adjustFrames(frames);
    
                    let container = document.getElementsByClassName("container");
                    container[0].appendChild(newFrame());
                    // Create a new div when advancing subStage
                }
            } else {
                turnNum++;
                pos = 0;
            }

            let nextIndex = formattedCSV[stage][subStage][turnNum];
            if (nextIndex["isImage"]){
                imgPos++;
                let id = (stage+1) + "-" + imgPos;
                // Write new function createImageBlock()
                var newBlock = createImage(nextIndex["isHero"], id);
                positionImage(newBlock);
                // add code to image opacity to onClickConvo
                newBlock.onclick = function() {
                    onclickImage(this);
                    onClickConvo(this, formattedCSV, stage, subStage, turnNum, pos, imgPos);
                };

            } else { 
                var newBlock = createHTMLBlock(nextIndex["content"], turnNum, true,
                                            undefined, nextIndex["user"]);
                newBlock.onclick = function() {onClickConvo(this, formattedCSV, stage, subStage, turnNum, pos, imgPos)};
            }
            let targetDiv = document.getElementById("currentConvo");
            targetDiv.appendChild(newBlock);

        }, 250);
    }
}

function resetHome(formattedCSV, num){
    // delete all frame elements that are not home or images
    var frames = Array.from(document.getElementsByClassName("frame"));
    frames = frames.filter(frame => frame.className == "frame" || frame.className == "frame current");
    frames.forEach(frame => {
        frame.remove();
    })

    // reset any convo images and counters
    activeImages = [];
    turnsSinceImages = [];

    // create and display new home texts and stages
    activeStages = [];
    displayHomeTexts(formattedCSV, num);
    
    // restyle cards for active / inactive based on stages
    pics = Array.from(pics);
    pics.forEach(pic => {
        pic.style.transform = "";
        pic.classList.remove("active", "disabled");
        imageNum = String(pic.id).replace("-img", "");
        imageNum = parseInt(imageNum);
        if(activeStages.indexOf(imageNum-1) != -1){
            pic.classList.add("active");
        } else {
            pic.classList.add("inactive");
        }
    })
    // reposition all cards
    positionCards();

}

function styleCurve(input, index, mult){
    return (1 - (0.02*mult) * ((index+1)**2)) * input;
}

function adjustFrames(frames) {
    // const textSize = 0.75 // in vw
    // const lineHeight = 1.25 // in vw
    // const width = 60 // in ch, convo block width
    // const frameSize = 100 //in percent
    let index = 0;
    frames.forEach(frame => {
        let blocks = Array.from(frame.getElementsByClassName("convo-block"));
        index++;
        //resize each convo block
        blocks.forEach(block => {
            block.style.fontSize = styleCurve(blockFont, index, 1) + "vw";
            block.style.lineHeight = styleCurve(blockHeight, index, 1) + "vw";
            block.style.width = styleCurve(blockWidth, index, 1) + "ch";
            block.style.margin = -styleCurve(margin, index, 1) + "vw";
        });

        //resize each frame
        frame.classList.remove("current");
        frame.style.width = styleCurve(frameSize, index, 1) + "%";
        frame.style.height = styleCurve(frameSize, index, 1) + "%";
        frame.style.opacity = styleCurve(opacity, index, 2);
        frame.style.justifyContent = "center";
        frame.style.zIndex = -(index);
        frame.id = "convo-" + index;
        console.log(frame.id);
       
    });
    
}

