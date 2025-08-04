import config from './configs/db-config.js';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import { Router } from 'express';
import eventService from '../services/evento.js';
import { checkOwnership, requireAuth } from '../middlewares/auth.js';
import pkg from 'pg';
import { validateEvent } from '../middleware/regex.js';

const router = Router();
const { Pool } = pkg;
const pool = new Pool(config);

router.get('/', async (req, res) => {
    const { nombre, fecha_inicio, tag } = req.query;

    try {
        const returnArray = (!nombre && !fecha_inicio && !tag)
            ? await eventService.getEvents()
            : await eventService.getEventParameters(null, nombre, fecha_inicio, tag);

        return res.status(StatusCodes.OK).json(returnArray);
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

router.post('/', requireAuth, validateEvent, async (req, res) => {
    const { name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance } = req.body;
    const { id } = req.user;
    const id_creator_user = id;

    if (!name || !description) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Name and description are required' });
    }

    const eventLocation = await eventService.getEventLocationsParameters(id_event_location);

    if (max_assistance < eventLocation[0].max_assistance) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Max assistance must be lower than the location limit' });
    }

    if (price < 0 || isNaN(price) || duration_in_minutes < 0 || isNaN(duration_in_minutes)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Price and duration must be positive numbers' });
    }

    const enrollmentPassedBinary = enabled_for_enrollment ? 1 : 0;

    const eventData = [
        name,
        description,
        id_event_category,
        id_event_location,
        start_date,
        duration_in_minutes,
        price,
        enrollmentPassedBinary,
        max_assistance,
        id_creator_user
    ];

    try {
        const newEvent = await eventService.createEvent(eventData);
        return res.status(StatusCodes.CREATED).json(newEvent);
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

router.put('/:id', requireAuth, validateEvent, checkOwnership, async (req, res) => {
    const id_event = req.params.id;
    const { name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance } = req.body;

    try {
        const event = await eventService.getOnlyEventParameters(id_event);
        if (!event) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Event not found' });

        const enrollmentEnabled = enabled_for_enrollment === true || enabled_for_enrollment === 1 || enabled_for_enrollment === '1' ? 1 : 0;

        if (price < 0 || isNaN(price) || duration_in_minutes < 0 || isNaN(duration_in_minutes)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Price and duration must be positive numbers' });
        }

        const eventLocation = await eventService.getEventLocationsParameters(id_event_location);
        if (eventLocation && max_assistance > eventLocation[0].max_capacity) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Max assistance must be lower than the location limit',
                details: { requested: max_assistance, locationLimit: eventLocation[0].max_capacity }
            });
        }

        const eventData = [
            name,
            description,
            id_event_category,
            id_event_location,
            start_date,
            duration_in_minutes,
            price,
            enrollmentEnabled,
            max_assistance,
            id_event
        ];

        const updatedEvent = await eventService.updateEvent(eventData);
        return res.status(StatusCodes.OK).json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const returnArray = await eventService.getEventParameters(id);
        return res.status(StatusCodes.OK).json(returnArray);
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

router.post('/:id/enrollment', requireAuth, async (req, res) => {
    const id_user = req.user.id;
    const id_event = req.params.id;
    const { description, attended, observations, rating } = req.body;

    try {
        const event = await eventService.getOnlyEventParameters(id_event);
        if (!event) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Event not found' });

        if (!event.enabled_for_enrollment) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Event is not enabled for enrollment' });
        }

        const currentDate = new Date();
        const eventDate = new Date(event.start_date);
        if (eventDate < currentDate) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Cannot enroll to an event that has already begun' });
        }

        const enrollments = await eventService.getEnrollment(id_user);
        const isAlreadyEnrolled = enrollments.some(e => parseInt(e.id_event) === parseInt(id_event));
        if (isAlreadyEnrolled) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'User is already enrolled in this event' });
        }

        const enrollmentCount = await eventService.checkEnrollmentEvent(id_event);
        if (enrollmentCount >= event.max_assistance) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Event is already full' });
        }

        const enrollmentData = [
            id_event,
            id_user,
            description || 'Inscripción realizada desde la aplicación',
            currentDate.toISOString(),
            attended === true || attended === 1 ? 1 : 0,
            observations || 'Sin observaciones',
            rating ? parseInt(rating) : 5
        ];

        const result = await eventService.enrollmentEvent(enrollmentData);
        return res.status(StatusCodes.CREATED).json({ message: 'Successfully enrolled in event', data: result });
    } catch (error) {
        console.error('Error during enrollment:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error during enrollment', error: error.message });
    }
});

export default router;
