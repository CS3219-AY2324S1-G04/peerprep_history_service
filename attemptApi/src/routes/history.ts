import express, { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '../helper/helper';
import { AttemptDataSource } from '../database/database';
import { AttemptEntity } from '../database/attemptEntity';
import Config from '../dataStructs/config';

const router = express.Router();
const config = Config.get()

/**
 * Gets user's attempt history (paginated)
 * 
 * Parameters:
 * - uid
 * - limit
 * - offset
 * 
 * 200 + data : success
 * 401 : Cannot verify JWT
 * 500 : Server error
 */
router.get('/', verifyJwt
                        , async (req, res) => {

    const uid = res.locals['user-id'];

    const limit : number = req.query.limit !== undefined ? Number(req.query.limit as string) : 5;
    const offset: number = req.query.offset !== undefined ? Number(req.query.offset as string) : 0;

    try {
        const result = await AttemptDataSource.getRepository(AttemptEntity)
            .createQueryBuilder('user')
            .select(['user.attemptId', 'user.questionId', 'user.language', 'user.date'])
            .where(`user.userId = :id`, { id: Number(uid)})
            .orderBy(`user.date`, "DESC")
            .limit(limit).offset(offset).getMany();
    
        res.status(200).send({message : 'success', data: result});
    } catch (error) {
        console.error(error)
        res.status(500).send({message: 'Unable to process request at this time.'})
    }

})

/**
 * Puts sample data based on the given parameters
 * 
 * Parameters:
 * - question
 * - room
 * - language
 * 
 * Body:
 * - The code itself
 * 
 * Example:
 * GET /attempt-service/manual?user=1&question=100&room=200&language=python3
 * Body: lorem ipsum
 * 
 * 200 + data : success
 * 401 : Cannot verify JWT
 * 500 : Server error
 */
router.post('/', verifyJwt, async (req, res) => { 

    const uid = res.locals['user-id'];
    const quid = req.query.question
    const rid = req.query.room
    const language = req.query.language
    const code = req.body

    try {
        await AttemptDataSource.createQueryBuilder()
            .insert().into(AttemptEntity)
            .values({
                userId : uid,
                questionId : quid,
                roomId : rid,
                language : language,
                code: code,
                // date: new Date(Date.now())
            }).orUpdate(
                ['code', 'attempt_date'],
                ['user_id', 'room_id']
            ).execute();
        res.status(200).json({message : 'Success'})
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Unable to process at this time.'})
    }

})

/**
 * Puts sample data based on the given parameters
 * 
 * Parameters:
 * - user
 * Note: User needs to be an integer
 * - question
 * - room
 * - language
 * 
 * Body:
 * - The code itself
 * 
 * Example:
 * GET /attempt-service/add?user=1&question=100&room=200&language=python3
 * Body json: { data : 'lorem ipsum' }
 * 
 * 200 + data : success
 * 500 : Server error
 */
router.get('/add', async (req, res) => { 

    const uid = Number(req.query.user) || '0';
    const quid = req.query.question || '1234'
    const rid = req.query.room || '54321'
    const language = req.query.language || 'python3' 
    const code = req.body || 'Lorem Ipsum'
    console.log(req.body)

    try {
        await AttemptDataSource.createQueryBuilder()
            .insert().into(AttemptEntity)
            .values({
                userId : uid,
                questionId : quid,
                roomId : rid,
                language : language,
                code: code,
                // date: new Date(Date.now())
            }).orUpdate(
                ['code', 'attempt_date'],
                ['user_id', 'room_id']
            ).execute();
        res.status(200).json({message : 'Success'})
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Unable to process at this time.'})
    }

})

/**
 * Count the number of attempts by users and rank them by user-id 
 * 
 * 
 * 200 + data : success
 * 500 : Server error
 */
router.get('/all', async (req, res) => {
    try {
        const result = await AttemptDataSource.getRepository(AttemptEntity)
            .createQueryBuilder('user')
            .select('user.userId', 'user-id')
            .addSelect('COUNT(*)', 'attempt_count')
            .groupBy('user.user_id')
            .orderBy('attempt_count', 'DESC')
            .addOrderBy('user.userId', 'ASC')
            .getRawMany();
    
        res.status(200).send({message : 'success', data: result});
    } catch (error) {
        console.error(error)
        res.status(500).send({message: 'Unable to process request at this time.'})
    }

})


/**
 * Gets the user's attempt specified by attempt id.
 * 200 + data : success
 * 200 + null : successful but result is null
 * 401 : Cannot verify JWT
 * 500 : Server error
 */
router.get('/:aid', verifyJwt, async (req, res) => {

    const uid = res.locals['user-id'];
    
    try {
        const result = await AttemptDataSource.getRepository(AttemptEntity)
            .createQueryBuilder('user')
            .select(['user.code'])
            .where(`user.userId = :id`, { id: Number(uid)})
            .andWhere(`user.attemptId = :aid`, { aid: req.params.aid}).getOne()
    
        res.status(200).send({message : 'success', data: result});
    } catch (error) {
        console.error(error)
        res.status(500).send({message: 'Unable to process request at this time.'})
    }

})

export default router;