import $ from 'jquery';

function updateBar(p) {
    let $bar = $('#progressbar');
    let $label = $('#progressbar-label');
    $bar.val(p * 100);
    $label.text(Math.round(p * 100) + '%');
}

export { updateBar };