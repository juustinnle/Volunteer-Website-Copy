document.addEventListener('DOMContentLoaded', function() {
    const dropdown = document.querySelector('.dropdown');
    const dropdownContent = document.querySelector('.dropdown-content');

    dropdown.addEventListener('click', function(event) {
        event.preventDefault();
        dropdownContent.classList.toggle('show');
    });

    // Close the dropdown if the user clicks outside of it
    window.onclick = function(event) {
        if (!event.target.matches('.dropbtn')) {
            const dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) {
                const openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    };

    // Skills Selection Handling
    const skillsSelect = document.getElementById('skills');
    const selectedSkillsContainer = document.getElementById('selected-skills');
    skillsSelect.addEventListener('change', function() {
        const selectedSkill = skillsSelect.options[skillsSelect.selectedIndex].text;
        const skillButton = document.createElement('button');
        skillButton.textContent = selectedSkill;
        skillButton.classList.add('skill-button');
        skillButton.addEventListener('click', function() {
            selectedSkillsContainer.removeChild(skillButton);
        });
        selectedSkillsContainer.appendChild(skillButton);
    });

    // Required Skills Selection Handling
    const requiredSkillsSelect = document.getElementById('required-skills');
    const selectedRequiredSkillsContainer = document.getElementById('selected-required-skills');
    requiredSkillsSelect.addEventListener('change', function() {
        const selectedSkill = requiredSkillsSelect.options[requiredSkillsSelect.selectedIndex].text;
        const skillButton = document.createElement('button');
        skillButton.textContent = selectedSkill;
        skillButton.classList.add('skill-button');
        skillButton.addEventListener('click', function() {
            selectedRequiredSkillsContainer.removeChild(skillButton);
        });
        selectedRequiredSkillsContainer.appendChild(skillButton);
    });

    // Date Range Selection Handling for Profile Page
    const addAvailabilityButton = document.getElementById('add-availability');
    const availabilityStartInput = document.getElementById('availability-start');
    const availabilityEndInput = document.getElementById('availability-end');
    const selectedDatesContainer = document.getElementById('selected-dates');

    addAvailabilityButton.addEventListener('click', function() {
        const startDate = availabilityStartInput.value;
        const endDate = availabilityEndInput.value;
        if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
                alert('End date cannot be before start date.');
            } else {
                const dateRange = `${startDate} to ${endDate}`;
                const dateButton = document.createElement('button');
                dateButton.textContent = dateRange;
                dateButton.classList.add('date-button');
                dateButton.addEventListener('click', function() {
                    selectedDatesContainer.removeChild(dateButton);
                });
                selectedDatesContainer.appendChild(dateButton);
                availabilityStartInput.value = '';
                availabilityEndInput.value = '';
            }
        } else {
            alert('Please select both start and end dates.');
        }
    });

    // Date Range Selection Handling for Event Management
    const addEventDateButton = document.getElementById('add-event-date');
    const eventStartDateInput = document.getElementById('event-start-date');
    const eventEndDateInput = document.getElementById('event-end-date');
    const selectedEventDatesContainer = document.getElementById('selected-event-dates');

    addEventDateButton.addEventListener('click', function() {
        const startDate = eventStartDateInput.value;
        const endDate = eventEndDateInput.value;
        if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
                alert('End date cannot be before start date.');
            } else {
                const dateRange = `${startDate} to ${endDate}`;
                const dateButton = document.createElement('button');
                dateButton.textContent = dateRange;
                dateButton.classList.add('date-button');
                dateButton.addEventListener('click', function() {
                    selectedEventDatesContainer.removeChild(dateButton);
                });
                selectedEventDatesContainer.appendChild(dateButton);
                eventStartDateInput.value = '';
                eventEndDateInput.value = '';
            }
        } else {
            alert('Please select both start and end dates.');
        }
    });

    // Show and hide sections based on navigation
    window.showSection = function(sectionId) {
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';
    };

    // Show the login section by default
    showSection('login');

    // Check if volunteer history is empty
    function checkVolunteerHistory() {
        const historyTableBody = document.querySelector('#history-table tbody');
        const emptyMessage = document.getElementById('empty-message');
        if (historyTableBody.children.length === 0) {
            emptyMessage.style.display = 'block';
        } else {
            emptyMessage.style.display = 'none';
        }
    }

    // Call checkVolunteerHistory when the page loads
    checkVolunteerHistory();
});
