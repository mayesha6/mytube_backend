import { Router } from "express"
import { UserRoutes } from "../modules/user/user.routes"
import { AuthRoutes } from "../modules/auth/auth.routes"
import { OtpRoutes } from "../modules/otp/otp.routes"
import { PlanRoutes } from "../modules/Plan/Plan.route"


export const router = Router()

const moduleRoutes = [
    {
        path: "/auth",
        route: AuthRoutes
    },
    {
        path: "/user",
        route: UserRoutes
    },
    {
        path: "/plan",
        route: PlanRoutes
    },
    

]

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

