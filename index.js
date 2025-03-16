

document.addEventListener('DOMContentLoaded', function(){
    let slides=document.querySelectorAll('.fades');
    let index=0;

    function showSlide(){
        slides.forEach((slide) =>{
            slide.classList.remove("active");
        });

        slides[index].classList.add("active");
        index=(index+1)%slides.length;
    }

    slides[0].classList.add("active");
    setInterval(showSlide,2000);
});