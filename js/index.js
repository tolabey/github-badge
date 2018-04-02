function httpGet(theUrl){
    return new Promise(function(resolve, reject) {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", theUrl);
        xmlHttp.send();
        xmlHttp.onload = function(){
            resolve({
                status: JSON.parse(xmlHttp.status),
                result: JSON.parse(xmlHttp.response)
            })
        }
    })
}

let git_user = document.getElementById("username");
let nick = document.getElementById("nick");
let git_pic = document.getElementById("git-pic");
let octocat = document.getElementById("octocat");

let tableMap = [];

// kümeler functions, belli görevler, solid 
function updateInnerText(keyMap){
    for(let key in keyMap) {
        document.getElementById(key).innerText = keyMap[key];
    }
}



function isGreaterThanThousand(data){
    if(data < 1000){
        return data;
    }
    const bolum = data / 1000;
    return "" + bolum.toFixed(1) + "k"; //use templete literals
}

function deleteRow(id){
    const a = document.getElementById(id);
    if(a){
        a.remove();
    }
}

function addRowToTable(data){ //example noktalı virgüller !! //table updater, => row adder => data updater => style updater
    const table = document.getElementById("log");
    const row = table.insertRow(1);
    row.style.backgroundColor = data.bgColor;
    if(data.bgColor !== "#E6E6FA"){
        row.classList.add("dontClick");
    }
    row.id = "table-row-" + data.nick;
    const arrData = [data.nick, data.repos, data.forks, data.followers, data.stargazers, data.count];
    let arr = [];
    a = row.insertCell(0);
    a.innerHTML = "<img src=" + data.git_pic + ">";
    for(let i = 0; i < 6; i++) {
        arr[i] = row.insertCell(i+ 1);
        arr[i].innerText = arrData[i];
    }
}

function prepareDatas(data){
    let repoCount = 0, forkCount = 0, stargazersCount = 0, languagesString = "", controlLang = {}, repoActivity = "";
    let date = [], graphData = [], today, controlDate;
    
    today = new Date();
    for(i = 0; i < 7; i++){
        graphData[i] = 0;
        date[i] = new Date();
        date[i].setDate(today.getDate() - ((i+1)*30)) // sabitler constant
    }
    data.result.map(function(data){
        controlDate = new Date(data.pushed_at);

        if(data.fork === false){
            repoCount++;
            stargazersCount += data.stargazers_count;

            if(data.language !== null && !(data.language in controlLang)){
                controlLang[data.language] = true;
                languagesString += data.language + ", ";
            }

            for(let i = 0; i < 7 ; i++) {
                if(controlDate > date[i]){
                    graphData[6 - i]++;
                    break;
                }
            }

            if(controlDate >  date[0]){
                repoActivity = "Worked on " + data.name;
            }
            
        } 
        else{
            forkCount++;
        }
        return data;
    })
    
    return {
        repoCount: isGreaterThanThousand(repoCount), //converter function ! named
        forkCount: isGreaterThanThousand(forkCount),
        stargazersCount: isGreaterThanThousand(stargazersCount),
        languagesString,
        graphData,
        repoActivity
    };
}

function createNewBadge(data) { //updateBadge !! named
        $(function() {
            $('.bar').sparkline(data.graph, {type: 'bar', barColor: 'green'});
        });
    
    let par = {
        repos: data.repos,
        forks: data.forks,
        stargazers: data.stargazers,
        followers: data.followers,
        languages: data.languages,
        nick: data.nick,
        repoActivity: data.repoActivity
    }
    nick.href = data.nick_link;
    git_pic.src = data.git_pic;

    updateInnerText(par);
}

function handle_git_user_name(init_user_name){ //camel case //var camel case //no dangle
    user_input = git_user.value;
    if(init_user_name !== undefined) {
        user_input = init_user_name;
    }

    if(init_user_name === undefined && git_user.value === ""){
        user_input = "facebook";
    }
    
    let githubApiUsers = "https://api.github.com/users/" + user_input; //url to variable
    let githubApiRepos = "https://api.github.com/users/" + user_input + "/repos?per_page=100";

    Promise.all([httpGet(githubApiUsers), httpGet(githubApiRepos)])
    .then(function(data){
        console.log(data);
        let tempData = {
            nick: user_input,
            nick_link: "#",
            repos: "-",
            forks: "-",
            stargazers: "-",
            followers: "-",
            languages: "-",
            bgColor: "#DB7093",
            repoActivity: "-",
            graph: [0,0,0,0,0,0]
        }

        if(tableMap["table-row-" + user_input]){ // count github request
            tableMap["table-row-" + user_input]++;
        }
        else{
            tableMap["table-row-" + user_input] = 1;
        }
        tempData["count"] = tableMap["table-row-" + user_input];

        if((data[0].status === 404 && data[1].status === 404)|| (data[0].status === 403 && data[1].status === 403)){
            if(data[0].status === 403){
                tempData.bgColor = "yellow";
            }
            tempData.git_pic = "./images/err.png";
        }
        else {
            let preparedData = prepareDatas(data[1]);
        
            tempData = {
                git_pic: data[0].result.avatar_url,
                nick: data[0].result.login,
                nick_link: "https://github.com/" + data[0].result.login,
                repos: preparedData.repoCount,
                forks: preparedData.forkCount,
                stargazers: preparedData.stargazersCount,
                languages: preparedData.languagesString,
                graph: preparedData.graphData,
                followers: isGreaterThanThousand(data[0].result.followers),
                git_pic: data[0].result.avatar_url,
                bgColor: "#E6E6FA",
                count: tableMap["table-row-" + user_input],
                repoActivity: preparedData.repoActivity
            }
        }

        deleteRow("table-row-"+tempData.nick);
        addRowToTable(tempData);
        createNewBadge(tempData);
    })
}

let timeout = null;
git_user.onkeyup = function() { //debounce
    clearTimeout(timeout);
    timeout = setTimeout(handle_git_user_name, 720);
}

document.getElementById("coni").addEventListener("click", function(e){ //dom onload why needed ?
    //e.target is the clicked element!
    //if it was a list item
    if(e.target && e.target.nodeName === "TD" && (e.target.parentElement.classList.value !== "dontClick")){    
        let target = e.target.parentElement.cells[1].innerText;
        
        handle_git_user_name(target);
    }
}, false)

handle_git_user_name("facebook");