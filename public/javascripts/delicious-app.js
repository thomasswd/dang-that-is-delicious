import '../sass/style.scss';

import { $, $$ } from './modules/bling';

//import autocomplete from './modules/autocomplete';

import typeAhead from './modules/typeAhead';
import ajaxHeart from './modules/heart';

//autocomplete($('#address'), $('#lat'), $('#lng'));

typeAhead( $('.search') );

//$$ is bling for queryselectorAll
const heartForms = $$('form.heart');
//with .on, you dont need to loop over the heartForms nodelist to listen for the event
heartForms.on('submit', ajaxHeart);

