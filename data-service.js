
var restaurants = new Array();
var departments = new Array();

var fs = require('fs');
var exports = module.exports = {};

exports.initialize = function() {
    let valid=true;
    fs.readFile('data/restaurants.json', 'utf-8', (err, data) => {
        restaurants = JSON.parse(data);
        if(err) valid=false;
    });
    if(valid==true){
    fs.readFile('data/departments.json', 'utf-8', (err, data) => {
        departments = JSON.parse(data);
        if(err) valid=false;
    });
    }
    return new Promise((resolve, reject) => {
       if(valid==true) resolve("Succeed");
        reject("unable to read file");
    });
};

exports.getAllRestaurants = function(){
    return new Promise((resolve, reject) => {
        resolve(restaurants);
        if(restaurants.length == 0)  reject("no results returned");
    });
};

exports.getRestaurant=function(name){
    return new Promise((resolve, reject)=>{
        let filtered=restaurants.filter(restaurants=>
            restaurants.name==name);
        resolve(filtered[0]);
        if(filtered.length==0)
        reject("no results returned");
    })
};

