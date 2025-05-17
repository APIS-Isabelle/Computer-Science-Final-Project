
$(document).ready(function() {
    console.log('Initializing enhanced animations');
    
    $('.container').addClass('fade-in');
    
    $('.feature-card').each(function(index) {
        const card = $(this);
        setTimeout(function() {
            card.addClass('slide-in');
        }, index * 150);
    });
    
    $('#scores-table tbody tr').each(function(index) {
        const row = $(this);
        setTimeout(function() {
            row.addClass('slide-in');
        }, index * 100); 
    });
    
    $('.stat-card').each(function(index) {
        const card = $(this);
        setTimeout(function() {
            card.addClass('bounce-in');
        }, 300 + (index * 150));
    });
    
    $('.step-card').each(function(index) {
        const step = $(this);
        setTimeout(function() {
            step.addClass('slide-in');
        }, 100 + (index * 200));
    });
    
    $('.hero-image').addClass('floating');
    
    $('.cta-buttons .btn-primary').addClass('pulse');
    
    $('.btn').hover(
        function() {
            $(this).addClass('btn-hover');
        },
        function() {
            $(this).removeClass('btn-hover');
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
    
    function animateModalOpen(modalId) {
        const modal = $(modalId);
        modal.fadeIn(300);
        modal.find('.modal-content').addClass('scale-in');
    }
    
    function animateModalClose(modalId) {
        const modal = $(modalId);
        modal.find('.modal-content').removeClass('scale-in').addClass('scale-out');
        setTimeout(function() {
            modal.fadeOut(300);
            modal.find('.modal-content').removeClass('scale-out');
        }, 200);
    }
    
    $(document).on('click', '[data-open-modal]', function() {
        const modalId = $(this).data('open-modal');
        animateModalOpen('#' + modalId);
    });
    
    $(document).on('click', '.close-modal, .modal-close-btn', function() {
        const modal = $(this).closest('.modal');
        animateModalClose('#' + modal.attr('id'));
    });
    
    $('.modal').on('click', function(e) {
        if ($(e.target).is('.modal')) {
            animateModalClose('#' + $(this).attr('id'));
        }
    });
    
    $('[data-count-up]').each(function() {
        const $this = $(this);
        const finalValue = parseInt($this.text());
        
        $this.text('0');
        
        $({ counter: 0 }).animate({ counter: finalValue }, {
            duration: 1000,
            easing: 'swing',
            step: function() {
                $this.text(Math.ceil(this.counter));
            },
            complete: function() {
                $this.text(finalValue);
            }
        });
    });
    
    $('.current-user').addClass('heartbeat');
    setTimeout(function() {
        $('.current-user').removeClass('heartbeat');
    }, 2000);
    
    console.log('Enhanced animations initialized');
});