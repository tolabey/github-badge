
let timeout = null;
const githubBaseUrl = "https://api.github.com/users/";
const utils = {

    abbreviateNumber(number){
        const million = 1000000, thousand = 1000;
        if(typeof number !== "number"){
            return number;
        }
        if(number > million){
            return (number / million).toFixed(1) + "m";
        }
        else if(number > thousand){
            return (number / thousand).toFixed(1) + "k";
        }
        return number + "";
    },

    viewSparklineGraph(dataArr) {
        $(function() {
            $('.bar').sparkline(dataArr, {type: 'bar', barColor: 'green'});
        });
    },

    viewUpdate(field, text){
        const elements = document.getElementsByClassName(field);

        for (let i = 0; i < elements.length; i++){
            elements[i].innerText = text;
        }
    },

    getRepoActivity(controlDate, repoDate, repoName = "There is no repo activity"){
        if(controlDate > repoDate){
            return null;
        }
        return "Recently worked on " + repoName;
    },

    createControlDates(arrSize, dateDistance){
        const today = new Date();
        let result = [];

        for(let i = 0; i < arrSize; i++){
            result[i] = new Date(today.setDate(today.getDate() - dateDistance));
        }
        return result;
    },

    prepareGraphData(controlDates, graphData, repoDate){
        for(let i = 0; i < controlDates.length; i++){
            if(repoDate > controlDates[i]){
                graphData[(controlDates.length - 1) - i] ++;
                break;
            }
        }
        return graphData;
    },

    httpGet(theUrl){
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
    },

    handleDebounce(executer, searchText) {
        clearTimeout(timeout);
        timeout = setTimeout(executer, 720, searchText);
    },

    addClassNameToCells(row){
        const classNames = ["login", "repos", "followers", "forks", "stargazers"];
        classNames.forEach(function(each, index){
            row.insertCell(index).className = each;
        });
    },

    removeClassNameFromCells(userName){
        const classNames = ["login", "repos", "followers", "forks", "stargazers"];
        const table = document.getElementById("log");
        classNames.forEach(function(className, index){
           table.rows[1].cells[index].classList.remove(className);
        });
    }


};

document.addEventListener("DOMContentLoaded", function() {

    handleSearch("facebook");

    document.querySelector(".search-bar").addEventListener("keyup", function (e) {
        utils.handleDebounce(handleSearch, e.target.value || "facebook");
    });

    function handleSearch(userName){
        const usersUrl = githubBaseUrl + userName;
        const reposUrl = githubBaseUrl + userName + "/repos?per_page=100";

        Promise.all([utils.httpGet(usersUrl), utils.httpGet(reposUrl)])
            .then(function(data){
                const userFields = [{id: "login", fallback: userName}, {id: "followers", fallback: "-"}];
                const reposFields = prepareReposFields(data[1].result);

                addNewRowToColumn(userName);

                userFields.forEach(function(eachField){
                    utils.viewUpdate(eachField.id, utils.abbreviateNumber(data[0].result[eachField.id]) || eachField.fallback);
                });


                if(data[0].status === 200){

                    reposFields.repoData.forEach(function(eachField){
                        utils.viewUpdate(eachField.id, eachField.value)
                    });

                    utils.viewSparklineGraph(reposFields.graphData.value || reposFields.graphData.fallback);

                    document.getElementById("avatar_url").src = data[0].result["avatar_url"];
                }
                else if(data[0].status === 404){
                    reposFields.repoData.forEach(function(eachField){
                        utils.viewUpdate(eachField.id, eachField.fallback);
                    });
                }
                else if(data[0].status === 403){
                    utils.viewUpdate("repo-activity", "Github not responding");
                }

                utils.removeClassNameFromCells(userName);

            })
            .catch(function(err){
                console.log(err);
            })
    }
});

function prepareReposFields(repos){ // create return object and a function to seperate 404 and 200 fallbacks and data

    let [forks, repoCount, stargazers, languages, repoActivity, controlMapLanguages, graphData] = [0, 0, 0, "", "", {}, [0, 0, 0, 0, 0, 0, 0]];
    const graphColumnNumber = 7, dateDistance = 10;


    const controlDateArr = utils.createControlDates(graphColumnNumber, dateDistance);

    if(repos[Symbol.iterator] !== undefined){
        repos.forEach(function(repo){
            if(!repo.fork) {
                repoCount++;
                stargazers += repo.stargazers_count;

                if(!(controlMapLanguages[repo.language]) && repo.language !== null ){
                    controlMapLanguages[repo.language] = true;
                    languages += repo.language + ", ";
                }

                graphData = utils.prepareGraphData(controlDateArr, graphData, new Date(repo.pushed_at));
                repoActivity = utils.getRepoActivity(controlDateArr[6], new Date(repo.pushed_at), repo.name) || repoActivity;
            }
            else{
                forks++;
            }
        });

    }

    return {
        repoData: [
            {id: "forks", value: utils.abbreviateNumber(forks), fallback: "-"},
            {id: "repos", value: utils.abbreviateNumber(repoCount), fallback: "-"},
            {id: "stargazers", value: utils.abbreviateNumber(stargazers), fallback: "-"},
            {id: "languages", value: languages + "", fallback: "-"},
            {id: "repo-activity", value: repoActivity + "", fallback: "-"},
        ],
        graphData: {id: "graph", value: graphData, fallback: [0,0,0,0,0,0,0]}
    }
}

function addNewRowToColumn(userName = "facebook"){

    console.log(userName);

    const tableRowControl = document.getElementById("row-class-" + userName);

    if(tableRowControl === null){
        createNewRow(userName);
    }
    else {
        updateRowIndex(userName);
    }
}

function createNewRow(userName){
    const table = document.getElementById("log");
    const row = table.insertRow(1);
    row.id = "row-class-" + userName;
    utils.addClassNameToCells(row);
}

function updateRowIndex(userName){
    const row = document.getElementById("row-class-" + userName);
    if(row){
        row.remove();
    }

    createNewRow(userName);
}