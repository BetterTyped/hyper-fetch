import { motion } from "motion/react";
import { Description, Particles, Title } from "@site/src/components";
import ReactIcon from "@site/static/img/integration-react.svg";
import NextIcon from "@site/static/img/integration-next.svg";
import RemixIcon from "@site/static/img/integration-remix.svg";
import AstroIcon from "@site/static/img/integration-astro.svg";
import NestIcon from "@site/static/img/integration-nest.svg";
import GraphqlIcon from "@site/static/img/integration-graphql.svg";
import RestIcon from "@site/static/img/integration-rest.svg";
import StrapiIcon from "@site/static/img/integration-strapi.svg";
import HasuraIcon from "@site/static/img/integration-hasura.svg";
import AppwriteIcon from "@site/static/img/integration-appwrite.svg";
import AirtableIcon from "@site/static/img/integration-airtable.svg";
import MedusaIcon from "@site/static/img/integration-medusa.svg";
import FirebaseIcon from "@site/static/img/integration-firebase.svg";
import SocketsIcon from "@site/static/img/integration-sockets.svg";
import KindeIcon from "@site/static/img/integration-kinde.svg";
import ClerkIcon from "@site/static/img/integration-clerk.svg";
import MapboxIcon from "@site/static/img/integration-mapbox.svg";
import GoogleMapsIcon from "@site/static/img/integration-google-maps.svg";
import Auth0Icon from "@site/static/img/integration-auth0.svg";

/* eslint-disable react/no-array-index-key */
// 8
const integrationsInner = [
  ReactIcon,
  FirebaseIcon,
  StrapiIcon,
  MedusaIcon,
  NestIcon,
  KindeIcon,
  GraphqlIcon,
  Auth0Icon,
];
// 12
const integrationsOuter = [
  AstroIcon,
  SocketsIcon,
  AirtableIcon,
  RestIcon,
  MapboxIcon,
  AppwriteIcon,
  NextIcon,
  Auth0Icon,
  HasuraIcon,
  GoogleMapsIcon,
  RemixIcon,
  ClerkIcon,
];

export const Integrations = () => {
  return (
    <div className="relative z-[-2] pt-10 -mb-[160px] md:-mb-[300px]">
      <Particles className="absolute inset-0 -z-10" />
      <div className="w-full max-w-[800px] mx-auto relative aspect-square flex items-center justify-center">
        <div className="relative z-10 text-center -mt-[40px] md:-mt-[80px]">
          <div className="max-w-[400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Title size="sm">Integrates with the tools of your choice</Title>
            </motion.div>
          </div>
          <div className="max-w-[500px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Description className="!mb-0">
                Written with no additional dependencies, fits perfectly into cutting edge solutions
              </Description>
            </motion.div>
          </div>
        </div>
        <motion.div
          className="absolute w-full h-full flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
        >
          {/* Circle Inner */}
          <div
            className="absolute animate-spin"
            style={{
              animationDuration: "80s",
            }}
          >
            <div className="w-[500px] lg:w-[600px] aspect-square rounded-full border border-zinc-500 flex items-center justify-center">
              {integrationsInner.map((Icon, i) => (
                <div
                  key={i}
                  className="absolute w-full h-10 md:h-12"
                  style={{
                    transform: `rotate(${i * (360 / integrationsInner.length)}deg)`,
                  }}
                >
                  <div className="relative flex items-center justify-center w-10 md:w-12 h-10 md:h-12 shiny-btn !rounded-full before:!rounded-full -translate-x-1/2 -translate-y-1/2">
                    <Icon
                      className="max-w-[50%] max-h-[50%]"
                      style={{
                        transform: `rotate(-90deg)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        <motion.div
          className="absolute w-full h-full flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {/* Circle Outer */}
          <div
            className="absolute animate-spin"
            style={{
              animationDuration: "120s",
              animationDirection: "reverse",
            }}
          >
            <div className="w-[700px] lg:w-[880px] aspect-square rounded-full border border-zinc-500 flex items-center justify-center">
              {integrationsOuter.map((Icon, i) => (
                <div
                  key={i}
                  className="absolute w-full h-10 md:h-12"
                  style={{
                    transform: `rotate(${i * (360 / integrationsOuter.length)}deg)`,
                  }}
                >
                  <div className="relative flex items-center justify-center w-10 md:w-12 h-10 md:h-12 shiny-btn !rounded-full before:!rounded-full -translate-x-1/2 -translate-y-1/2">
                    <Icon
                      className="max-w-[50%] max-h-[50%]"
                      style={{
                        transform: `rotate(-90deg)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      {/* Backdrop */}
      <div className="absolute bottom-[-50vh] w-full h-[calc(70%+50vh)] z-[2] bg-gradient-to-b from-transparent to-[var(--background)] to-20%" />
    </div>
  );
};
