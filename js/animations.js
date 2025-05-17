$(document).ready(function() {
    console.log('Animations initialized');
    
    $('.container').addClass('fade-in');
    
    $(document).on('click', 'a[href^="index.html"], a[href^="game.html"], a[href^="results.html"], a[href^="leaderboard.html"], a[href^="tutorial.html"]', function(e) {
        if (!e.isDefaultPrevented()) {
            e.preventDefault();
            
            const url = $(this).attr('href');
            const currentPage = $('.container');
            
            currentPage.removeClass('fade-in').addClass('page-exit');
            
            setTimeout(function() {
                window.location.href = url;
            }, 500);
        }
    });
    
    $('.feature-card').each(function(index) {
        const card = $(this);
        setTimeout(function() {
            card.addClass('slide-in');
        }, index * 150);
    });
    
    $('.step-card').each(function(index) {
        const step = $(this);
        setTimeout(function() {
            step.addClass('slide-in');
        }, index * 200);
    });
    
    $('.stat-card').each(function(index) {
        const stat = $(this);
        setTimeout(function() {
            stat.addClass('scale-in');
        }, index * 100);
    });
    
    $('.round-item').each(function(index) {
        const round = $(this);
        setTimeout(function() {
            round.addClass('slide-in');
        }, index * 150);
    });
    
    $('.btn').hover(
        function() {
            $(this).addClass('pulse');
        },
        function() {
            $(this).removeClass('pulse');
        }
    );
    
    $('nav ul li a').hover(
        function() {
            if (!$(this).hasClass('active')) {
                $(this).addClass('text-fade-in');
            }
        },
        function() {
            $(this).removeClass('text-fade-in');
        }
    );
    
    $('.feature-card, .step-card, .stat-card').hover(
        function() {
            $(this).addClass('card-hover');
        },
        function() {
            $(this).removeClass('card-hover');
        }
    );
    
    $('.step-card').click(function() {
        $('.step-card').removeClass('active');
        $(this).addClass('active');
    });
    
    $('input').focus(function() {
        $(this).addClass('input-focus');
    }).blur(function() {
        $(this).removeClass('input-focus');
    });
    
    $('#login-btn, #signup-btn').click(function() {
        if (!$(this).prop('disabled')) {
            $(this).addClass('btn-click');
            setTimeout(() => {
                $(this).removeClass('btn-click');
            }, 300);
        }
    });
    
    $('.modal').on('show.modal', function() {
        $(this).fadeIn().css('display', 'flex');
        $(this).find('.modal-content').addClass('scale-in');
    });
    
    $('.modal').on('hide.modal', function() {
        const modal = $(this);
        modal.find('.modal-content').removeClass('scale-in');
        setTimeout(function() {
            modal.fadeOut();
        }, 300);
    });
    
    $(document).on('showModal', function(e, modalId) {
        $(`#${modalId}`).trigger('show.modal');
    });
    
    $(document).on('hideModal', function(e, modalId) {
        $(`#${modalId}`).trigger('hide.modal');
    });
    
    const css = `
        .card-hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .input-focus {
            border-color: var(--primary-color) !important;
            box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.2);
        }
        
        .btn-click {
            transform: scale(0.95);
        }
    `;
    
    if ($('#custom-animation-styles').length === 0) {
        $('head').append(`<style id="custom-animation-styles">${css}</style>`);
    }
});

function fadeInElement(element, duration = 300) {
    $(element).css('opacity', 0).show().animate({
        opacity: 1
    }, duration);
}

function fadeOutElement(element, duration = 300) {
    $(element).animate({
        opacity: 0
    }, duration, function() {
        $(this).hide();
    });
}

function slideInFromTop(element, duration = 500) {
    const initialPosition = $(element).css('position');
    
    if (initialPosition === 'static') {
        $(element).css('position', 'relative');
    }
    
    $(element)
        .css({
            opacity: 0,
            top: '-30px'
        })
        .show()
        .animate({
            opacity: 1,
            top: '0'
        }, duration, function() {
            if (initialPosition === 'static') {
                $(element).css('position', initialPosition);
            }
        });
}

function slideInFromBottom(element, duration = 500) {
    const initialPosition = $(element).css('position');
    
    if (initialPosition === 'static') {
        $(element).css('position', 'relative');
    }
    
    $(element)
        .css({
            opacity: 0,
            top: '30px'
        })
        .show()
        .animate({
            opacity: 1,
            top: '0'
        }, duration, function() {
            if (initialPosition === 'static') {
                $(element).css('position', initialPosition);
            }
        });
}

function scaleWithBounce(element, duration = 500) {
    $(element)
        .css({
            opacity: 0,
            transform: 'scale(0.5)'
        })
        .show()
        .animate({
            opacity: 1
        }, {
            duration: duration,
            step: function(now, fx) {
                if (fx.prop === 'opacity') {
                    let scale;
                    const progress = fx.pos;
                    
                    if (progress < 0.5) {
                        scale = 0.5 + (1.2 * progress);
                    } else if (progress < 0.8) {
                        scale = 1.1 - ((progress - 0.5) * 0.5);
                    } else {
                        scale = 0.9 + ((progress - 0.8) * 0.5);
                    }
                    
                    $(element).css('transform', `scale(${scale})`);
                }
            },
            complete: function() {
                $(element).css('transform', 'scale(1)');
            }
        });
}

function shakeElement(element, duration = 500) {
    const initialPosition = $(element).css('position');
    
    if (initialPosition === 'static') {
        $(element).css('position', 'relative');
    }
    
    $(element).animate(
        { left: -10 }, 50,
        function() {
            $(this).animate({ left: 10 }, 100)
                  .animate({ left: -7 }, 100)
                  .animate({ left: 7 }, 100)
                  .animate({ left: -5 }, 100)
                  .animate({ left: 0 }, 50, function() {
                      if (initialPosition === 'static') {
                          $(element).css('position', initialPosition);
                      }
                  });
        }
    );
}

function typeText(element, text, speed = 50) {
    let i = 0;
    $(element).html('');
    
    function typeChar() {
        if (i < text.length) {
            $(element).append(text.charAt(i));
            i++;
            setTimeout(typeChar, speed);
        }
    }
    
    typeChar();
}

function countUp(element, targetNumber, duration = 1500) {
    $({ counter: 0 }).animate(
        { counter: targetNumber },
        {
            duration: duration,
            easing: 'swing',
            step: function() {
                $(element).text(Math.ceil(this.counter));
            },
            complete: function() {
                $(element).text(targetNumber);
            }
        }
    );
}

window.koreaGeoGuessr = window.koreaGeoGuessr || {};
window.koreaGeoGuessr.animations = {
    fadeInElement,
    fadeOutElement,
    slideInFromTop,
    slideInFromBottom,
    scaleWithBounce,
    shakeElement,
    typeText,
    countUp
};