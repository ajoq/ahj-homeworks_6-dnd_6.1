export default class Tickets {
    constructor(tickets) {
        this.ticketsArr = [];
        if (tickets) this.ticketsArr = tickets;
        this.lastTicketId = this.ticketsArr.length;
        this.clearVars();
    }

    init() {
        this.tasks = document.querySelector('.tasks');
        this.columnItems = document.querySelectorAll('.column-items');
        this.events();
        this.updateList();
    }

    events() {
        this.tasks.addEventListener('pointerdown', (e) => this.clickEvents(e));
        this.tasks.addEventListener('pointermove', (e) => this.ticketMove(e));
        this.tasks.addEventListener('pointerleave', () => this.ticketLeave());
        this.tasks.addEventListener('pointerup', (e) => this.ticketDrop());
    }

    clearVars() {
        this.draggedEl = null;
        this.draggedElCoords = null;
        this.ghostEl = null;
        this.ghostElEmpty = null;
        this.cursX = null;
        this.cursY = null;
        this.insertItem = null;
        this.insertPosition = null;
    }

    clickEvents(e) {
        if (e.target.closest('.add-item')) {
            this.addTicketCancel();
            this.addAnotherTicket(e);
            return;
        }
        
        if (e.target.closest('.ticket-form')) return;

        if (e.target.closest('.column-item__delete')) {
            console.log('Удоли!');
            return;
        };

        if (e.target.closest('.column-item')) {
            this.ticketGrab(e, e.target.closest('.column-item'));
            return;
        }
    }

    addAnotherTicket(e) {
        const colItems = e.target.closest('.column').querySelector('.column-items');

        const form = document.createElement('form');
        form.classList.add('ticket-form');
        form.name = 'ticketForm';
        form.innerHTML = `
            <textarea name="ticketFormValue" class="add-area" required></textarea>
            <div class="buttons">
                <button class="add-btn" type="submit">Add card</button>
                <button class="delete-btn">&#10005;</button>
            </div>            
        `;

        colItems.after(form);

        const addAnotherCard = e.target.closest('.add-item');
        addAnotherCard.classList.add('hidden');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCard(e);
        }, { once: true });
    }

    addCard(e) {
        console.log('Submit!');
        console.log(e);

        
    }

    addTicketCancel() {
        const form = document.querySelector('.ticket-form');

        if (!form) return;

        form.remove();
        const addAnotherCardButtonHidden = document.querySelector('.add-item.hidden');
        addAnotherCardButtonHidden.classList.remove('hidden');
    }

    emptyGhostElement(e) {
        let elemBelow = document.elementFromPoint(e.clientX, e.clientY);

        if (!elemBelow.closest('.column') || !elemBelow.closest('.column-items') || elemBelow.closest('.column-item.empty')) return;

        if (elemBelow.closest('.column-items').innerHTML === '') {
            elemBelow.closest('.column-items').append(this.ghostElEmpty);
            this.insertItem = {column: elemBelow.closest('.column-items').dataset.id};
            return;
        }

        if (!elemBelow.closest('.column-item')) return;


        if (e.pageY === elemBelow.getBoundingClientRect().top + elemBelow.getBoundingClientRect().height / 2) {
            return;
        }

        if (e.pageY < elemBelow.getBoundingClientRect().top + elemBelow.getBoundingClientRect().height / 2) {
            elemBelow.closest('.column-item').before(this.ghostElEmpty);
            this.insertPosition = 'before';
        }

        if (e.pageY > elemBelow.getBoundingClientRect().top + elemBelow.getBoundingClientRect().height / 2) {
            elemBelow.closest('.column-item').after(this.ghostElEmpty);
            this.insertPosition = 'after';
        }
        
        this.insertItem = {id: +(elemBelow.closest('.column-item').dataset.id), column: elemBelow.closest('.column-items').dataset.id, position: this.insertPosition};
    }

    ticketGrab(e, item) {
        e.preventDefault();
        this.addTicketCancel();

        if (!item) return;

        this.draggedEl = item;
        this.draggedElCoords = this.draggedEl.getBoundingClientRect();

        this.ghostEl = item.cloneNode(true);
        this.ghostEl.classList.add('dragged');
        
        this.ghostElEmpty = item.cloneNode(false);
        this.ghostElEmpty.classList.add('empty');
        this.ghostElEmpty.style.height = this.draggedElCoords.height - 16 + 'px';
        this.ghostElEmpty.style.backgroundColor = '#d5dbde';

        document.body.append(this.ghostEl);

        this.ghostEl.style.left = `${this.draggedElCoords.left - 8}px`;
        this.ghostEl.style.top = `${this.draggedElCoords.top - 8}px`;
        this.cursX = e.pageX - this.draggedElCoords.left + 8;
        this.cursY = e.pageY - this.draggedElCoords.top + 8;

        this.emptyGhostElement(e);
        item.remove();
    }

    ticketMove(e) {
        e.preventDefault();
        if (!this.draggedEl) return;
        this.ghostEl.style.left = `${e.pageX - this.cursX}px`;
        this.ghostEl.style.top = `${e.pageY - this.cursY}px`;

        this.emptyGhostElement(e);
    }

    ticketLeave() {
        if (!this.draggedEl) return;

        this.ghostEl.remove();
        this.clearVars();
        this.updateList()
        return;
    }

    ticketDrop() {
        if (!this.draggedEl) return;
        this.ghostEl.remove();
        this.ghostElEmpty.remove();

        this.insertTicket();
        this.clearVars();
    }

    insertTicket() {
        const travelerTicket = this.ticketsArr.find(ticket => ticket.id === +(this.draggedEl.dataset.id));
        
        if (this.insertItem.id === travelerTicket.id) {
            this.updateList();
            return;
        }

        travelerTicket.column = this.insertItem.column;

        const travelerTicketIndex = this.ticketsArr.findIndex(ticket => ticket.id === +(this.draggedEl.dataset.id));
        this.ticketsArr.splice(travelerTicketIndex, 1);

        if (!this.insertItem.id && !this.insertItem.position) {
            this.ticketsArr.push(travelerTicket);            
        } else {
            const insertTicketIndex = this.ticketsArr.findIndex(ticket => ticket.id === +(this.insertItem.id));         
            if (this.insertItem.position === 'before') this.ticketsArr.splice(insertTicketIndex, 0, travelerTicket);
            if (this.insertItem.position === 'after') this.ticketsArr.splice(insertTicketIndex + 1, 0, travelerTicket);
        }

        this.updateList();
    }

    updateList() {
        Array.from(this.columnItems).forEach(column => {
            column.innerHTML = '';
        });

        this.ticketsArr.forEach(ticket => {

            const col = Array.from(this.columnItems).find(column => ticket.column === column.dataset.id);

            const ticketDiv = document.createElement('div');
            ticketDiv.className = 'column-item';
            ticketDiv.dataset.id = ticket.id;

            ticketDiv.innerHTML = `
                <div class="column-item__text">${ticket.text}</div>
                <div class="column-item__delete"></div>           
            `;

            col.append(ticketDiv);
        });
    }
}