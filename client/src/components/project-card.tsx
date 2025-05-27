import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SelectProject } from "@shared/schema";
import { AccountCircle } from "@mui/icons-material";

type ProjectCardProps = {
  project: SelectProject;
  coordinator?: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
};

export function ProjectCard({ project, coordinator }: ProjectCardProps) {
  const { t } = useTranslation();
  
  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.round(((project.currentAmount || 0) / project.targetAmount) * 100),
    100
  );
  
  // Format the collected and target amounts
  const formattedCollected = new Intl.NumberFormat('uk-UA').format(
    project.currentAmount || 0
  );
  
  const formattedTarget = new Intl.NumberFormat('uk-UA').format(
    project.targetAmount
  );

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="flex-shrink-0 h-48 relative">
        <img 
          className="h-full w-full object-cover" 
          src={project.imageUrl || "https://images.unsplash.com/photo-1593113630400-ea4288922497?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"} 
          alt={project.name} 
        />
      </div>
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div className="flex-1">
          <Link href={`/projects/${project.id}`}>
            <div className="block mt-2 cursor-pointer">
              <h3 className="text-xl font-semibold text-gray-900 font-heading">
                {project.name}
              </h3>
              <p className="mt-3 text-base text-gray-500 line-clamp-3">
                {project.description}
              </p>
            </div>
          </Link>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-1000" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">
              {t('home.projects.collected')}: {formattedCollected} ₴
            </span>
            <span className="font-medium text-gray-800">
              {t('home.projects.target')}: {formattedTarget} ₴
            </span>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AccountCircle className="text-primary" />
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-900">
                {coordinator?.firstName || coordinator?.username || ''}
              </p>
              <p className="text-xs text-gray-500">
                {t('roles.coordinator')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/projects/${project.id}/slider`}>
              <Button 
                size="sm"
                variant="outline"
                className="flex items-center border-primary-500 text-primary-700 hover:bg-primary-50"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {t('projects.details.view')}
              </Button>
            </Link>
            <Link href={project.projectStatus === 'fundraising' ? `/donate/${project.id}` : `/projects/${project.id}`}>
              <Button 
                size="sm"
                className="text-white bg-secondary-500 hover:bg-secondary-600"
              >
                {project.projectStatus === 'fundraising' 
                  ? t('home.projects.donateButton') 
                  : t('projects.details.view')}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
