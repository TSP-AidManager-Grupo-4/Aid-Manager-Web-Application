import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/home.component.vue'
import Calendar from '../pages/calendar.component.vue'
import Analytics from "@/pages/analytics.component.vue";
import Team from "@/pages/team.component.vue";
import todoComponent from "@/components/projects/todo.component.vue";
import Login from "@/pages/login/login-content.component.vue";
import MainLayoutPage from "@/pages/main-layout/main-layout-page.vue";
import SignUp from "@/pages/signup/signup-content.component.vue";
import PaymentDetails from "@/pages/payment-details/payment-details.component.vue";
import Setup from "@/pages/preliminar-setup/setup-content.component.vue";
import NewPost from "@/pages/new-post.component.vue";
import Profile from "@/pages/profile.component.vue";
import ProjectsComponent from "@/pages/projects.component.vue";
import Subscription from "@/pages/subscription/subscription-content.component.vue";
import Identification from "@/pages/identification-frame/identification-frame.component.vue";
import OAuthCallback from "@/pages/login/oauthcallback.vue";

const routes = [
    { path: '/login', component: Login, meta: { title: 'Login' } },
    { path: '/register', component: SignUp, meta: { title: 'Sign Up' } },
    { path: '/identification', component: Identification, meta: { title: 'ID' } },
    { path: '/payment', component: PaymentDetails, meta: { title: 'Payments' } },
    { path: '/setup', component: Setup, meta: { title: 'Setup' } },
    { path: '/subscription', component: Subscription, meta: { title: 'Subscription' } },
    { path: '/oauth/callback', component: OAuthCallback, meta: { title: 'Authenticating...' } },
    { path: '/connect/:userId', name: 'oauth-connect', component: OAuthCallback, meta: { title: 'Authenticating...' } },
    { path: '/', redirect: '/login' },
    {
        path: '/',
        component: MainLayoutPage,
        children: [
            { path: 'home', component: Home, meta: { title: 'Home Page' }},
            { path: 'calendar', component: Calendar, meta: { title: 'Calendar' } },
            { path: 'projects', component: ProjectsComponent, meta: { title: 'Projects' } },
            { path: 'projects/:id/toDo', name: 'projectTodo', component: todoComponent, props: true, meta: { title: 'Tasks' } },
            { path: 'analytics', component: Analytics, meta: { title: 'Analytics' } },
            { path: 'team', component: Team, meta: { title: 'Team' } },
            { path: 'new-post', component: NewPost, meta: { title: 'Post' } },
            { path: 'profile/:id', name:'profile', component: Profile, meta: { title: 'Profile' } },
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router