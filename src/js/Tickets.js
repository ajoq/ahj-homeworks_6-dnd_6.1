export default class Tickets {
    constructor(tickets) {
        this.ticketsArr = [];
        if (tickets) this.ticketsArr = tickets;
        this.clearVars();
    }

    init() {
        this.tasks = document.querySelector('.tasks');
        this.columnItems = document.querySelectorAll('.column-items');
        if (localStorage.getItem('cards')) this.ticketsArr = JSON.parse(localStorage.getItem('cards'));
        this.lastTicketId = this.ticketsArr[this.ticketsArr.length - 1].id;
        this.events();
        this.updateList();    }

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

        if (e.target.closest('.delete-btn')) {
            e.preventDefault();
            this.addTicketCancel();
            return;
        }
        
        if (e.target.closest('.ticket-form')) return;

        if (e.target.closest('.column-item__delete')) {
            this.deleteCard(e);
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
        form.noValidate = true;
        form.innerHTML = `
            <textarea name="ticketFormValue" class="add-area" placeholder="Enter a text for this card" required></textarea>
            <div class="buttons">
                <button class="add-btn" type="submit">Add card</button>
                <button class="delete-btn" type="reset">&#10005;</button>
            </div>            
        `;

        colItems.after(form);

        const addAnotherCard = e.target.closest('.add-item');
        addAnotherCard.classList.add('hidden');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (form.ticketFormValue.value.trim() === '') {
                this.showError('Поле не может быть пустым', form.ticketFormValue);
                return;
            }

            this.addCard(colItems.dataset.id, form.ticketFormValue.value);
        });

        setTimeout(() => form.ticketFormValue.focus(), 10);

        form.ticketFormValue.addEventListener('focus', () => this.hideError());
        form.ticketFormValue.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                e.preventDefault();
                // form.submit(); // Не срабатывает обработка submit, заданная выше
                document.querySelector('.add-btn').click(); // А вот так срабатывает
            }
        });

    }

    addCard(column, text) {
        this.lastTicketId += 1;
        this.ticketsArr.push({id: this.lastTicketId, column, text});

        this.addTicketCancel();
        this.updateList();
    }

    addTicketCancel() {
        const form = document.querySelector('.ticket-form');

        if (!form) return;

        form.remove();
        const addAnotherCardButtonHidden = document.querySelector('.add-item.hidden');
        addAnotherCardButtonHidden.classList.remove('hidden');
    }

    deleteCard(e) {
        const deleteItemId = +e.target.closest('.column-item').dataset.id;
        const deleteItemIndex = this.ticketsArr.findIndex((item) => item.id === deleteItemId);
        this.ticketsArr.splice(deleteItemIndex, 1);
        this.updateList();
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

    showError(text, input) {
        const popoverDiv = document.createElement('div');
        popoverDiv.className = 'popover';
    
        const arrowDiv = document.createElement('div');
        arrowDiv.className = 'arrow';
    
        const popoverContent = document.createElement('div');
        popoverContent.className = 'popover-body';
        popoverContent.textContent = text;
    
        popoverDiv.append(arrowDiv);
        popoverDiv.append(popoverContent);
    
        input.after(popoverDiv);

        popoverDiv.style.top = `${input.getBoundingClientRect().height + 8}px`;
        popoverDiv.style.left = `${(input.getBoundingClientRect().width / 2) - (popoverDiv.getBoundingClientRect().width / 2)}px`;
        arrowDiv.style.left = `${(popoverDiv.getBoundingClientRect().width / 2) - (arrowDiv.getBoundingClientRect().width) + 3}px`;
    
        popoverDiv.classList.add('popover-visible');
      }

      hideError() {
          const popover = document.querySelector('.popover');
          if (popover) popover.remove();
      }

    ticketGrab(e, item) {
        e.preventDefault();
        this.addTicketCancel();

        if (!item) return;

        this.draggedEl = item;
        this.draggedElCoords = this.draggedEl.getBoundingClientRect();

        this.ghostEl = item.cloneNode(true);
        this.ghostEl.classList.add('dragged');
        // this.ghostEl.classList.add('grabbing');
        
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
        // console.log(e.target);
        // document.body.style.cursor = 'grabbing';

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

        localStorage.setItem('cards', JSON.stringify(this.ticketsArr));
    }
}