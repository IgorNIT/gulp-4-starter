'use strict'

var cars = ['BMW', 'Volvo', 'Mini', 'Volvo2', 'Mini2', 'Volvo23', 'Mini3'];


let num = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/*
cars.forEach( function(element, index, array){
	console.log(index + ' - ' + element + " -- ");
});*/

/*let newNum = num.map(myFunction);


function myFunction(value, index, array) {
	return value * 2;
}*/



let newNum = num.reduceRight(muReduseRight);


function myFunction(total, value, index, array) {
	console.log(index + '  ' + array);
	return total + value * 10;

}



function muReduseRight(total, value , index){

	console.log(value);
	return total + value;

}

console.log(newNum);

()=>{
	alert('aaa');
}

