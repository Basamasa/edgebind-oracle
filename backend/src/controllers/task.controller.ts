import type { Request, Response } from "express"

import { taskService } from "../services/task.service"

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export function listTasksHandler(req: Request, res: Response) {
  const tasks = taskService.listTasks({
    ownerId: typeof req.query.ownerId === "string" ? req.query.ownerId : undefined,
    workerId: typeof req.query.workerId === "string" ? req.query.workerId : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  })

  res.json(tasks)
}

export function listOwnerTasksHandler(req: Request, res: Response) {
  const ownerId = getParamValue(req.params.ownerId)
  if (!ownerId) {
    res.status(400).json({ error: "ownerId route param is required" })
    return
  }

  const tasks = taskService.listTasks({
    ownerId,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  })

  res.json(tasks)
}

export function getTaskByIdHandler(req: Request, res: Response) {
  const taskId = getParamValue(req.params.taskId)
  if (!taskId) {
    res.status(400).json({ error: "taskId route param is required" })
    return
  }

  const task = taskService.getTaskById(taskId)
  res.json(task)
}

export function createTaskHandler(req: Request, res: Response) {
  const task = taskService.createTask(req.body)
  res.status(201).json(task)
}

export function acceptTaskHandler(req: Request, res: Response) {
  const taskId = getParamValue(req.params.taskId)
  if (!taskId) {
    res.status(400).json({ error: "taskId route param is required" })
    return
  }

  const task = taskService.acceptTask(taskId, req.body)
  res.json(task)
}

export function submitTaskHandler(req: Request, res: Response) {
  const taskId = getParamValue(req.params.taskId)
  if (!taskId) {
    res.status(400).json({ error: "taskId route param is required" })
    return
  }

  const task = taskService.submitTask(taskId, req.body)
  res.json(task)
}

export function approveTaskHandler(req: Request, res: Response) {
  const taskId = getParamValue(req.params.taskId)
  if (!taskId) {
    res.status(400).json({ error: "taskId route param is required" })
    return
  }

  const task = taskService.approveTask(taskId, req.body)
  res.json(task)
}
