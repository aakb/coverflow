// ITK, Aarhus Kommunes Biblioteker, 2013

var carousel = { };

var myConfig = {
  max_image_width : 330,
  max_image_height : 330,
  iframe_width : 480,
  iframe_height : 360, // 4/3 forhold
  image_border : 3, // pixels
  space_between_images : 0.20, // procent
  visible_images : 3, // synlige
  set_of_images: 3, // de synlige sæt, før/aktivt/efter
  id_prefix_images : 'imb', // tilfældige unikke tegn
  animation : 1000, // tid i ms
  opacity : 0.8, // opacity til knapper når animation er aktiv
  update_check : 3600*1000, // check hver time
  update_period : 86400 * 1000 / 2, // reload hver 12. time
  logo_url : ''
};

Array.prototype.shuffle = function () {
  for (var i = this.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = this[i];
    this[i] = this[j];
    this[j] = tmp;
  }
  return this;
}

function create_banner (current_list) {
  // ud fra den aktuelle liste oprettes banner med et mindre antal billeder (som løbende skiftes)
  // den tidligere carussel fjernes og den nye oprettes

  // bland listen af numre
  current_list.shuffle();

  // håndter lister af forskellig længde
  var listlength;
  if ( current_list.length < myConfig.set_of_images * myConfig.visible_images ) {
    listlength = current_list.length;
    carousel.small_list = true;
  } else {
    listlength = myConfig.set_of_images * myConfig.visible_images;
    carousel.small_list = false;
  }
  //console.log(current_list.length)

  // dan banner-html
  var s = '';
  for ( i = 0; i < listlength; i++) {
     s += create_li_element (i, current_list[i])
  };

  var el = document.createElement('ul');
  $(el).html(s);

  // slet tidligere carousel
  if(carousel.obj) $('.imagebanner').jcarousel('destroy');

  // overfør data
  $('.imagebanner').html(el);

  // opret carousel - animation http://jqueryui.com/effect/#easing
  carousel.obj = $('.imagebanner').jcarousel({ 'wrap': 'circular','animation': { 'duration': myConfig.animation, 'easing':   'easeInOutCubic'  } });

  // initialiser pointer
  carousel.max_pointer = Math.floor( current_list.length / myConfig.visible_images );
  carousel.current_list = current_list;

  // det sidste sæt skal indeholde de sidste billeder i listen - dette trick ordner dette
  carousel.pointer = 1;
  update_banner(-1);

  carousel.scroll_in_action = false;

  // opdater størrelser i css
  banner_recalculate();
}

function modulo(a,b) {
  // håndterer negative tal (i modsætning til %)
  var res = a % b;
  return res < 0 ? res + b : res;
}

function update_banner(offset){
  // håndterer visningen af den lange liste ved at skifte billederne løbende

  // skip hvis listen er lille
  if(carousel.small_list) return;

  carousel.pointer += offset;

  var list_id = myConfig.visible_images * modulo( carousel.pointer+offset, carousel.max_pointer)
  var set_id = myConfig.visible_images * modulo( carousel.pointer+offset, myConfig.set_of_images)

  // udskift det resp. set med de nye billeder fra listen
  for ( i=0; i < myConfig.visible_images; i++) {
    update_li_element(set_id+i, carousel.current_list[list_id+i])
  }
}

function banner_recalculate(onlyImg) {
  // banner_width = (width+border) * visible_images + (margin between images) * ( visible_images - 1 )
  // margin between images = (some factor) * (width+border)
  // beregn width

  var banner_width = $('.imagebanner').outerWidth(true);

  var new_image_width_and_border = Math.floor( banner_width / ( myConfig.visible_images +  myConfig.space_between_images * (myConfig.visible_images -1 ) ) )
  var new_image_width = new_image_width_and_border - 2 * myConfig.image_border
  var new_image_margin = Math.floor( myConfig.space_between_images * new_image_width_and_border )

  var new_image_height =  Math.floor( new_image_width * myConfig.max_image_height / myConfig.max_image_width )

  var new_banner_width = myConfig.visible_images * new_image_width_and_border + ( myConfig.visible_images -1 ) * new_image_margin
  var new_banner_margin = Math.floor(( banner_width - new_banner_width ) / 2);
  var new_banner_height = new_image_height + 2 * myConfig.image_border

  $('.imagebanner img').css( { 'margin-right' : new_image_margin, 'width' : new_image_width, 'height' : new_image_height } );
  $('.imagebanner').css( { 'height' : new_banner_height, 'margin-left' : new_banner_margin, 'margin-right' : new_banner_margin } );

  var banner_height = $('.wrapper').outerHeight() - $('.body-header').outerHeight();
  var banner_padding = Math.floor(( banner_height - new_banner_height ) /2 );
  $('#imagecontainer').css( { 'padding-top' : banner_padding, 'padding-bottom' : banner_padding });
}

function scroll(evnt){
  // håndter scrol af billeder hvilket dels betyder opdatering af indholdet i banneret og dels selve scrolningen

  // karusellen skifter så nulstil idletime
  carousel.idleTime=0;

  // skip scrol hvis fancybox er åben
  if ( $.fancybox.isOpen ) return;

  // fortsæt kun hvis der ikke er en aktiv scroll
  if(!carousel.scroll_in_action) {
     carousel.scroll_in_action = true;
     $('.navbutton').css('opacity', myConfig.opacity);
     update_banner(evnt.data.offset);

     var relative_offset = ( evnt.data.offset > 0 ? '+=' : '-=' ) + myConfig.visible_images;
     $('.imagebanner').jcarousel('scroll', relative_offset,  true, function() { carousel.scroll_in_action = false; $('.navbutton').css('opacity', 1); } )
  }
  return false;
}

function create_events() {

   // navi-buttons
   $('.imagebanner-left').click( { offset: -1 }, scroll);
   $('.imagebanner-right').click( { offset: 1 }, scroll);

    // swipe
    $("body").touchwipe({
           wipeLeft: function() { $('.imagebanner-right').click(); },
           wipeRight: function() { $('.imagebanner-left').click(); },
         //  wipeUp: function() { alert("up"); },
         //  wipeDown: function() { alert("down"); },
           min_move_x: 20,
           min_move_y: 20,
           preventDefaultEvents: true
      });

    // pile-tasterne
    $("body").on('keyup', function (event) { if (event.which == 39) { $('.imagebanner-right').click()} else if (event.which == 37) { $('.imagebanner-left').click()} });

    // inaktiv-checkeren...
    carousel.idleTime = 0;
    setInterval(function() { carousel.idleTime+= 3; if(carousel.idleTime>=9) { $('.imagebanner-right').click();} }, 3000);
    $("body").on('mousemove', function (event) { carousel.idleTime = 0; });
    $("body").on('keypress',  function (event) { carousel.idleTime = 0; });

    // resize vil ændre størrelser som hermed opdateres
    $(window).on('resize', banner_recalculate);

    // klik på billede skal trigge popup
    $(".imagebanner").on("click", "img", function(event){ show_popupbox($(this).data('id'));return false; });

    if (myConfig.logo_url) $(".logo").on("click", function(event){ location.href = myConfig.logo_url });

}

function create_li_element (key, value) {
  // opretter li element til brug i banneret
  return '<li><img id="' + myConfig.id_prefix_images + key + '" data-id="' + value + '" src="' + bannerdata.prefix + bannerdata.id[value].src + '" width="' + myConfig.max_image_width + '" height="' + myConfig.max_image_height + '" alt="" /></li>'
}

function update_li_element(key, value){
  // opdaterer li element i banneret
  $('#' + myConfig.id_prefix_images + key).attr('src', bannerdata.prefix + bannerdata.id[value].src ).data('id', value);
}

function show_popupbox(idno) {


  $('#popupdata').html( '<h3>' + bannerdata.id[idno].t + '</h3>'
  //+ '<img class="popup-image" src="' + bannerdata.prefix + bannerdata.id[idno].src + '" />'
  //+ bannerdata.id[idno].d
  + '<iframe width="'+ myConfig.iframe_width +'" height="'+ myConfig.iframe_height +'" src="http://www.youtube.com/embed/' + bannerdata.id[idno].youtubeid + '?feature=player_detailpage" frameborder="0" allowfullscreen></iframe>'
  + '<div class="popup-desc">' + bannerdata.id[idno].d + '</div>'
  + '');

  // vis boksen (ifald den tidligere er fadeout
  $('#popup').show();  // hide efter submit 4 sek

  // sæt fancyboks op og aktiver den
  var maxfancyheight = Math.floor($('#imagecontainer').outerHeight()*0.75);
  $("#inline").fancybox({ maxHeight : maxfancyheight }).click();

  // log visning af fancyboks
  ga('send', 'event', 'image', 'click', 'node-' + idno);

}

function check_updates(){
  // kører periodevis og reloader hele siden efter fastsat tid
  var now=(new Date()).getTime();
  if ( now - carousel.starttime > myConfig.update_period ) {
    location.reload(true)
  }
}

$(document).ready(function(){

  // imagebanner
  create_banner(bannerdata.list[bannerdata.first]);

  // initialiser events
  create_events();

  // check for updates
  carousel.starttime = (new Date()).getTime();
  setInterval(check_updates, myConfig.update_check);

});
