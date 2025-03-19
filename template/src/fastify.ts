import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'


const bootstrap = async (port: number | string) => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )
  await app.listen(port)
  
  console.log(`\nApplication is running on: ${ await app.getUrl() }`)
}

bootstrap(process.env.PORT ?? 3000).catch(console.error)
