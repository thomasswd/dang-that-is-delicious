import axios from 'axios'
import { $ } from './bling'

function ajaxHeart(e) {
    //prevent the form from automatically updating through the browser
    e.preventDefault();
    console.log(this.action)
    //post the action from the action of the heart form
    axios.post(this.action).then(res => {
        e.preventDefault();
        //check whether the button in the heart form with name of 'heart' has the following class
        const isHearted = this.heart.classList.toggle('heart__button--hearted');

        //select the element with the heart-count class and set the text to the amount of stores have been hearted
        //this takes the length of the user's heart array and displays the number
        $('.heart-count').textContent = res.data.hearts.length;

        //if the button has been toggled with the class of heartbuttonhearted, add the float class for animation
        if(isHearted) {
            //add the class to the button for the selected button
            this.heart.classList.add('heart__button--float');
            //after a set time, remove the class
            setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500)
        }
    }).catch( err => console.log('error'))
}

export default ajaxHeart