"use strict";
let EXPORTED_SYMBOLS = ["TCloud"];

let TCloud = {

	showPage: function(document, db) {
		let template = this.template;
		document.title = "Tag Cloud :: Classic Add-ons Archive";

		let contfrag = document.createRange().createContextualFragment(template);
		let page = document.getElementById("page");
		let frag = contfrag.firstElementChild;
		page.appendChild(frag);
	},

	template: `<html>
 <body>
  <div>

    <section class="secondary">
      <nav id="side-nav" class="c" data-addontype="1">
        <h2>Explore</h2>
        <ul id="side-explore">
          <li class="s-users"><em><a href="caa:list?sort=users">Most Popular</a></em></li>
          <li class="s-rating"><em><a href="caa:list?sort=rating">Top Rated</a></em></li>
        </ul>
        <h2>Categories</h2>
        <ul id="side-categories">
          <li id="c-0"><a href="caa:list">All</a></li>
          <li id="c-72"><a href="caa:list/alerts-updates">Alerts &amp; Updates</a></li>
          <li id="c-14"><a href="caa:list/appearance">Appearance</a></li>
          <li id="c-22"><a href="caa:list/bookmarks">Bookmarks</a></li>
          <li id="c-5"><a href="caa:list/download-management">Download Management</a></li>
          <li id="c-1"><a href="caa:list/feeds-news-blogging">Feeds, News &amp; Blogging</a></li>
          <li id="c-142"><a href="caa:list/games-entertainment">Games &amp; Entertainment</a></li>
          <li id="c-37"><a href="caa:list/language-support">Language Support</a></li>
          <li id="c-38"><a href="caa:list/photos-music-videos">Photos, Music &amp; Videos</a></li>
          <li id="c-12"><a href="caa:list/privacy-security">Privacy &amp; Security</a></li>
          <li id="c-13"><a href="caa:list/search-tools">Search Tools</a></li>
          <li id="c-141"><a href="caa:list/shopping">Shopping</a></li>
          <li id="c-71"><a href="caa:list/social-communication">Social &amp; Communication</a></li>
          <li id="c-93"><a href="caa:list/tabs">Tabs</a></li>
          <li id="c-4"><a href="caa:list/web-development">Web Development</a></li>
          <li id="c-73"><a href="caa:list/other">Other</a></li>
        </ul>
      </nav>
    </section>

    <section class="primary">
      <h1>Most Popular Tags</h1>
      <div class="island hero c listing">

<div class="tcloud" id="demo" style="width: 720px; height: 520px; position: relative;">
<span style="left: 283px; top: 231px;" class="tcw w10"><a href="caa:list?tag=toolbar">toolbar</a></span>
<span style="left: 276px; top: 175px;" class="tcw w9"><a href="caa:list?tag=search">search</a></span>
<span style="left: 228px; top: 293px;" class="tcw w8"><a href="caa:list?tag=google">google</a></span>
<span style="left: 282px; top: 126px;" class="tcw w8"><a href="caa:list?tag=youtube">youtube</a></span>
<span style="left: 367px; top: 289px;" class="tcw w7"><a href="caa:list?tag=tab">tab</a></span>
<span style="left: 433px; top: 296px;" class="tcw w7"><a href="caa:list?tag=facebook">facebook</a></span>
<span style="left: 442px; top: 242px;" class="tcw w7"><a href="caa:list?tag=bookmarks">bookmarks</a></span>
<span style="left: 122px; top: 247px;" class="tcw w7"><a href="caa:list?tag=download">download</a></span>
<span style="left: 223px; top: 352px;" class="tcw w7"><a href="caa:list?tag=security">security</a></span>
<span style="left: 425px; top: 192px;" class="tcw w6"><a href="caa:list?tag=tabs">tabs</a></span>
<span style="left: 166px; top: 155px;" class="tcw w6"><a href="caa:list?tag=privacy">privacy</a></span>
<span style="left: 400px; top: 346px;" class="tcw w6"><a href="caa:list?tag=video">video</a></span>
<span style="left: 264px; top: 82px;" class="tcw w6"><a href="caa:list?tag=shopping">shopping</a></span>
<span style="left: 516px; top: 194px;" class="tcw w6"><a href="caa:list?tag=url">url</a></span>
<span style="left: 451px; top: 137px;" class="tcw w6"><a href="caa:list?tag=twitter">twitter</a></span>
<span style="left: 122px; top: 301px;" class="tcw w5"><a href="caa:list?tag=image">image</a></span>
<span style="left: 206px; top: 396px;" class="tcw w5"><a href="caa:list?tag=bookmark">bookmark</a></span>
<span style="left: 479px; top: 354px;" class="tcw w5"><a href="caa:list?tag=sports">sports</a></span>
<span style="left: 351px; top: 337px;" class="tcw w5"><a href="caa:list?tag=link">link</a></span>
<span style="left: 429px; top: 387px;" class="tcw w5"><a href="caa:list?tag=music">music</a></span>
<span style="left: 165px; top: 109px;" class="tcw w5"><a href="caa:list?tag=amazon">amazon</a></span>
<span style="left: 73px; top: 211px;" class="tcw w5"><a href="caa:list?tag=dictionary">dictionary</a></span>
<span style="left: 204px; top: 218px;" class="tcw w4"><a href="caa:list?tag=social">social</a></span>
<span style="left: 108px; top: 367px;" class="tcw w4"><a href="caa:list?tag=athletics">athletics</a></span>
<span style="left: 568px; top: 205px;" class="tcw w4"><a href="caa:list?tag=news">news</a></span>
<span style="left: 315px; top: 38px;" class="tcw w4"><a href="caa:list?tag=productivity">productivity</a></span>
<span style="left: 547px; top: 157px;" class="tcw w4"><a href="caa:list?tag=share">share</a></span>
<span style="left: 402px; top: 96px;" class="tcw w4"><a href="caa:list?tag=firefox">firefox</a></span>
<span style="left: 319px; top: 428px;" class="tcw w4"><a href="caa:list?tag=button">button</a></span>
<span style="left: 175px; top: 338px;" class="tcw w4"><a href="caa:list?tag=web">web</a></span>
<span style="left: 359px; top: 384px;" class="tcw w4"><a href="caa:list?tag=links">links</a></span>
<span style="left: 583px; top: 335px;" class="tcw w4"><a href="caa:list?tag=seo">seo</a></span>
<span style="left: 91px; top: 188px;" class="tcw w3"><a href="caa:list?tag=college">college</a></span>
<span style="left: 480px; top: 114px;" class="tcw w3"><a href="caa:list?tag=text">text</a></span>
<span style="left: 414px; top: 424px;" class="tcw w3"><a href="caa:list?tag=proxy">proxy</a></span>
<span style="left: 92px; top: 325px;" class="tcw w3"><a href="caa:list?tag=rss">rss</a></span>
<span style="left: 74px; top: 294px;" class="tcw w3"><a href="caa:list?tag=menu">menu</a></span>
<span style="left: 543px; top: 387px;" class="tcw w3"><a href="caa:list?tag=gmail">gmail</a></span>
<span style="left: 132px; top: 398px;" class="tcw w3"><a href="caa:list?tag=history">history</a></span>
<span style="left: 48px; top: 261px;" class="tcw w3"><a href="caa:list?tag=images">images</a></span>
<span style="left: 235px; top: 53px;" class="tcw w3"><a href="caa:list?tag=email">email</a></span>
<span style="left: 487px; top: 77px;" class="tcw w3"><a href="caa:list?tag=password">password</a></span>
<span style="left: 183px; top: 438px;" class="tcw w3"><a href="caa:list?tag=language">language</a></span>
<span style="left: 433px; top: 56px;" class="tcw w3"><a href="caa:list?tag=mp3">mp3</a></span>
<span style="left: 141px; top: 77px;" class="tcw w3"><a href="caa:list?tag=javascript">javascript</a></span>
<span style="left: 486px; top: 428px;" class="tcw w3"><a href="caa:list?tag=block">block</a></span>
<span style="left: 262px; top: 464px;" class="tcw w3"><a href="caa:list?tag=translate">translate</a></span>
<span style="left: 383px; top: 456px;" class="tcw w3"><a href="caa:list?tag=development">development</a></span>
<span style="left: 131px; top: 145px;" class="tcw w2"><a href="caa:list?tag=copy">copy</a></span>
<span style="left: 566px; top: 186px;" class="tcw w2"><a href="caa:list?tag=football">football</a></span>
<span style="left: 524px; top: 117px;" class="tcw w2"><a href="caa:list?tag=save">save</a></span>
<span style="left: 604px; top: 287px;" class="tcw w2"><a href="caa:list?tag=flash">flash</a></span>
<span style="left: 564px; top: 369px;" class="tcw w2"><a href="caa:list?tag=yahoo">yahoo</a></span>
<span style="left: 202px; top: 290px;" class="tcw w2"><a href="caa:list?tag=free">free</a></span>
<span style="left: 629px; top: 265px;" class="tcw w2"><a href="caa:list?tag=sidebar">sidebar</a></span>
<span style="left: 559px; top: 116px;" class="tcw w2"><a href="caa:list?tag=translation">translation</a></span>
<span style="left: 511px; top: 405px;" class="tcw w2"><a href="caa:list?tag=html">html</a></span>
<span style="left: 70px; top: 155px;" class="tcw w2"><a href="caa:list?tag=theme">theme</a></span>
<span style="left: 626px; top: 204px;" class="tcw w2"><a href="caa:list?tag=wikipedia">wikipedia</a></span>
<span style="left: 613px; top: 166px;" class="tcw w2"><a href="caa:list?tag=university">university</a></span>
<span style="left: 100px; top: 119px;" class="tcw w2"><a href="caa:list?tag=bing">bing</a></span>
<span style="left: 220px; top: 91px;" class="tcw w2"><a href="caa:list?tag=css">css</a></span>
<span style="left: 472px; top: 44px;" class="tcw w2"><a href="caa:list?tag=search%20engine">search engine</a></span>
<span style="left: 339px; top: 471px;" class="tcw w2"><a href="caa:list?tag=ads">ads</a></span>
<span style="left: 609px; top: 143px;" class="tcw w2"><a href="caa:list?tag=english">english</a></span>
<span style="left: 113px; top: 100px;" class="tcw w2"><a href="caa:list?tag=online">online</a></span>
<span style="left: 50px; top: 172px;" class="tcw w2"><a href="caa:list?tag=hide">hide</a></span>
<span style="left: 649px; top: 235px;" class="tcw w2"><a href="caa:list?tag=new%20tab">new tab</a></span>
<span style="left: 10px; top: 235px;" class="tcw w2"><a href="caa:list?tag=coupons">coupons</a></span>
<span style="left: 611px; top: 318px;" class="tcw w2"><a href="caa:list?tag=context%20menu">context menu</a></span>
<span style="left: 569px; top: 89px;" class="tcw w2"><a href="caa:list?tag=ebay">ebay</a></span>
<span style="left: 177px; top: 55px;" class="tcw w2"><a href="caa:list?tag=photo">photo</a></span>
<span style="left: 246px; top: 204px;" class="tcw w1"><a href="caa:list?tag=color">color</a></span>
<span style="left: 491px; top: 177px;" class="tcw w1"><a href="caa:list?tag=deals">deals</a></span>
<span style="left: 77px; top: 244px;" class="tcw w1"><a href="caa:list?tag=extension">extension</a></span>
<span style="left: 282px; top: 68px;" class="tcw w1"><a href="caa:list?tag=firebug">firebug</a></span>
<span style="left: 95px; top: 353px;" class="tcw w1"><a href="caa:list?tag=navigation">navigation</a></span>
<span style="left: 137px; top: 174px;" class="tcw w1"><a href="caa:list?tag=chat">chat</a></span>
<span style="left: 367px; top: 495px;" class="tcw w1"><a href="caa:list?tag=cookies">cookies</a></span>
<span style="left: 256px; top: 26px;" class="tcw w1"><a href="caa:list?tag=keyboard">keyboard</a></span>
<span style="left: 195px; top: 373px;" class="tcw w1"><a href="caa:list?tag=mail">mail</a></span>
<span style="left: 93px; top: 405px;" class="tcw w1"><a href="caa:list?tag=popup">popup</a></span>
<span style="left: 545px; top: 445px;" class="tcw w1"><a href="caa:list?tag=addon">addon</a></span>
<span style="left: 636px; top: 359px;" class="tcw w1"><a href="caa:list?tag=downloader">downloader</a></span>
<span style="left: 24px; top: 317px;" class="tcw w1"><a href="caa:list?tag=recommended">recommended</a></span>
<span style="left: 352px; top: 20px;" class="tcw w1"><a href="caa:list?tag=browser">browser</a></span>
<span style="left: 415px; top: 18px;" class="tcw w1"><a href="caa:list?tag=shortcut">shortcut</a></span>
<span style="left: 32px; top: 350px;" class="tcw w1"><a href="caa:list?tag=manager">manager</a></span>
<span style="left: 607px; top: 394px;" class="tcw w1"><a href="caa:list?tag=screenshot">screenshot</a></span>
<span style="left: 587px; top: 424px;" class="tcw w1"><a href="caa:list?tag=testing">testing</a></span>
<span style="left: 55px; top: 379px;" class="tcw w1"><a href="caa:list?tag=tracking">tracking</a></span>
<span style="left: 10px; top: 285px;" class="tcw w1"><a href="caa:list?tag=accessibility">accessibility</a></span>
<span style="left: 661px; top: 292px;" class="tcw w1"><a href="caa:list?tag=notification">notification</a></span>
<span style="left: 430px; top: 483px;" class="tcw w1"><a href="caa:list?tag=sharing">sharing</a></span>
<span style="left: 119px; top: 431px;" class="tcw w1"><a href="caa:list?tag=developer">developer</a></span>
<span style="left: 25px; top: 210px;" class="tcw w1"><a href="caa:list?tag=highlight">highlight</a></span>
<span style="left: 324px; top: 7px;" class="tcw w1"><a href="caa:list?tag=upload">upload</a></span>
</div>

      </div>
    </section>

  </div>
 </body>
</html>`

};